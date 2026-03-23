#!/usr/bin/env python3
"""
Import tracks from a Spotify playlist into Apple Music using local audio files.

Workflow:
1) Read Spotify playlist track metadata (title + artists) using either:
   - Playwright scraping from a public playlist URL, or
   - Spotify Web API OAuth (private/public account playlists).
2) Scan local music files and build a fuzzy-match index.
3) Create/update an Apple Music playlist and add matched files via AppleScript.
"""

from __future__ import annotations

import argparse
import base64
import shutil
import json
import hashlib
import http.server
import os
import pathlib
import re
import secrets
import socketserver
import subprocess
import sys
import tempfile
import threading
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from difflib import SequenceMatcher
from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

try:
    from rapidfuzz import fuzz

    def fuzzy_ratio(left: str, right: str) -> float:
        return float(fuzz.ratio(left, right))

except Exception:
    def fuzzy_ratio(left: str, right: str) -> float:
        if not left or not right:
            return 0.0
        return SequenceMatcher(None, left, right).ratio() * 100.0

try:
    from mutagen import File as MutagenFile
except Exception:
    MutagenFile = None

try:
    from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
    from playwright.sync_api import sync_playwright
except Exception:
    PlaywrightTimeoutError = RuntimeError
    sync_playwright = None


AUDIO_EXTENSIONS = {
    ".mp4",
    ".m4v",
    ".mp3",
    ".m4a",
    ".aac",
    ".alac",
    ".wav",
    ".aif",
    ".aiff",
    ".flac",
    ".ogg",
    ".opus",
}

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE = "https://api.spotify.com/v1"
SPOTIFY_DEFAULT_REDIRECT_URI = "http://127.0.0.1:8989/callback"
SPOTIFY_DEFAULT_SCOPES = "playlist-read-private playlist-read-collaborative user-library-read"
SPOTIFY_TOKEN_CACHE = pathlib.Path.home() / ".codex" / "spotify_oauth_token.json"


@dataclass
class SpotifyTrack:
    title: str
    artists: List[str]


@dataclass
class SpotifyPlaylistSummary:
    id: str
    name: str
    owner: str
    public: Optional[bool]
    tracks_total: int


@dataclass
class LocalTrack:
    path: pathlib.Path
    title: str
    artists: List[str]
    norm_title: str
    norm_artists: List[str]


@dataclass
class MatchResult:
    spotify_title: str
    spotify_artists: List[str]
    matched: bool
    local_path: Optional[str]
    local_title: Optional[str]
    local_artists: List[str]
    score: float


def slugify_filename(value: str) -> str:
    value = value.strip()
    value = re.sub(r"[\\/:*?\"<>|]+", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()[:180] or "track"


def normalize_text(value: str) -> str:
    value = value.lower().strip()
    value = value.replace("&", " and ")
    value = re.sub(r"\(feat\.?[^)]*\)", "", value)
    value = re.sub(r"\[feat\.?[^]]*\]", "", value)
    value = re.sub(r"\bfeat\.?\s+[^-_,/]+", "", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def parse_filename_fallback(path: pathlib.Path) -> Tuple[str, List[str]]:
    stem = path.stem
    if " - " in stem:
        left, right = stem.split(" - ", 1)
        return right.strip(), [left.strip()]
    return stem, []


def read_local_track(path: pathlib.Path) -> LocalTrack:
    title = ""
    artists: List[str] = []

    if MutagenFile is not None:
        try:
            mf = MutagenFile(path, easy=True)
            if mf and mf.tags:
                title = (mf.tags.get("title") or [""])[0].strip()
                artists = [a.strip() for a in (mf.tags.get("artist") or []) if a.strip()]
                if not artists:
                    artists = [a.strip() for a in (mf.tags.get("albumartist") or []) if a.strip()]
        except Exception:
            pass

    if not title:
        title, fallback_artists = parse_filename_fallback(path)
        if not artists:
            artists = fallback_artists

    norm_title = normalize_text(title)
    norm_artists = [normalize_text(a) for a in artists if normalize_text(a)]

    return LocalTrack(
        path=path,
        title=title,
        artists=artists,
        norm_title=norm_title,
        norm_artists=norm_artists,
    )


def iter_audio_files(root: pathlib.Path) -> Iterable[pathlib.Path]:
    for dirpath, dirnames, filenames in os.walk(root, topdown=True):
        # Skip system/metadata folders that can appear/disappear on external drives.
        dirnames[:] = [d for d in dirnames if d not in {".Trashes", ".Spotlight-V100", ".fseventsd"}]
        base = pathlib.Path(dirpath)
        for name in filenames:
            path = base / name
            try:
                if path.suffix.lower() in AUDIO_EXTENSIONS and path.is_file():
                    yield path
            except FileNotFoundError:
                # File disappeared during scan; ignore and continue.
                continue


def _b64url_no_padding(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def extract_spotify_playlist_id(value: str) -> str:
    candidate = value.strip()
    if not candidate:
        return ""

    match = re.search(r"open\.spotify\.com/playlist/([A-Za-z0-9]+)", candidate)
    if match:
        return match.group(1)

    match = re.search(r"spotify:playlist:([A-Za-z0-9]+)", candidate)
    if match:
        return match.group(1)

    if re.fullmatch(r"[A-Za-z0-9]+", candidate):
        return candidate

    return ""


def spotify_token_still_valid(token_data: Dict[str, Any]) -> bool:
    access_token = token_data.get("access_token", "")
    expires_at = int(token_data.get("expires_at", 0) or 0)
    return bool(access_token) and expires_at > int(datetime.now().timestamp()) + 60


def load_cached_spotify_token(client_id: str, scopes: str) -> Optional[Dict[str, Any]]:
    try:
        cached = json.loads(SPOTIFY_TOKEN_CACHE.read_text(encoding="utf-8"))
    except Exception:
        return None

    if cached.get("client_id") != client_id:
        return None

    required_scopes = {s for s in scopes.split() if s.strip()}
    cached_scopes = {s for s in str(cached.get("scopes", "")).split() if s.strip()}
    if not required_scopes.issubset(cached_scopes):
        return None

    return cached


def save_spotify_token(token_data: Dict[str, Any]) -> None:
    SPOTIFY_TOKEN_CACHE.parent.mkdir(parents=True, exist_ok=True)
    SPOTIFY_TOKEN_CACHE.write_text(json.dumps(token_data, indent=2), encoding="utf-8")


def spotify_token_request(form_data: Dict[str, str]) -> Dict[str, Any]:
    encoded = urllib.parse.urlencode(form_data).encode("utf-8")
    request = urllib.request.Request(
        SPOTIFY_TOKEN_URL,
        data=encoded,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = response.read().decode("utf-8")
        data = json.loads(payload)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Spotify token request failed ({exc.code}): {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Spotify token request failed: {exc}") from exc

    if "access_token" not in data:
        raise RuntimeError(f"Spotify token response missing access token: {data}")
    return data


def refresh_spotify_token(refresh_token: str, client_id: str) -> Dict[str, Any]:
    refreshed = spotify_token_request(
        {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": client_id,
        }
    )
    if "refresh_token" not in refreshed:
        refreshed["refresh_token"] = refresh_token
    return refreshed


class _SpotifyOAuthCallbackHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        expected_path = getattr(self.server, "redirect_path", "/callback")
        if parsed.path != expected_path:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not found")
            return

        params = urllib.parse.parse_qs(parsed.query)
        expected_state = getattr(self.server, "expected_state", "")
        self.server.oauth_code = params.get("code", [""])[0]
        self.server.oauth_state = params.get("state", [""])[0]
        self.server.oauth_error = params.get("error", [""])[0]

        if not self.server.oauth_error and self.server.oauth_state != expected_state:
            self.server.oauth_error = "state_mismatch"

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        if self.server.oauth_error:
            body = f"<html><body><h3>Spotify auth failed: {self.server.oauth_error}</h3></body></html>"
        else:
            body = "<html><body><h3>Spotify auth complete. You can close this tab.</h3></body></html>"
        self.wfile.write(body.encode("utf-8"))
        getattr(self.server, "oauth_event").set()

    def log_message(self, format: str, *args: object) -> None:  # noqa: A003
        return


def authorize_spotify_via_browser(
    client_id: str,
    redirect_uri: str,
    scopes: str,
    timeout_seconds: int = 180,
) -> Dict[str, Any]:
    parsed_redirect = urllib.parse.urlparse(redirect_uri)
    if parsed_redirect.scheme != "http" or parsed_redirect.hostname not in {"127.0.0.1", "localhost"}:
        raise RuntimeError("Spotify redirect URI must be local http://127.0.0.1:<port>/callback or localhost.")
    if not parsed_redirect.port:
        raise RuntimeError("Spotify redirect URI must include an explicit port, e.g. http://127.0.0.1:8989/callback")

    verifier = _b64url_no_padding(secrets.token_bytes(64))
    challenge = _b64url_no_padding(hashlib.sha256(verifier.encode("ascii")).digest())
    state = _b64url_no_padding(secrets.token_bytes(24))

    class ReusableTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    server = ReusableTCPServer((parsed_redirect.hostname, parsed_redirect.port), _SpotifyOAuthCallbackHandler)
    server.redirect_path = parsed_redirect.path or "/callback"
    server.expected_state = state
    server.oauth_code = ""
    server.oauth_state = ""
    server.oauth_error = ""
    server.oauth_event = threading.Event()

    waiter = threading.Thread(target=server.handle_request, daemon=True)
    waiter.start()

    auth_params = {
        "client_id": client_id,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "scope": scopes,
        "state": state,
        "code_challenge_method": "S256",
        "code_challenge": challenge,
    }
    auth_url = f"{SPOTIFY_AUTH_URL}?{urllib.parse.urlencode(auth_params)}"
    print("Opening browser for Spotify login/consent...")
    if not webbrowser.open(auth_url):
        print(f"Open this URL manually in your browser:\n{auth_url}")

    if not server.oauth_event.wait(timeout_seconds):
        server.server_close()
        raise RuntimeError("Spotify authorization timed out waiting for callback.")

    server.server_close()

    if server.oauth_error:
        raise RuntimeError(f"Spotify authorization failed: {server.oauth_error}")
    if not server.oauth_code:
        raise RuntimeError("Spotify authorization returned no code.")

    token_data = spotify_token_request(
        {
            "grant_type": "authorization_code",
            "code": server.oauth_code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "code_verifier": verifier,
        }
    )
    return token_data


def get_spotify_access_token(
    client_id: str,
    redirect_uri: str,
    scopes: str,
    force_login: bool,
    allow_browser_login: bool,
) -> str:
    token_data: Optional[Dict[str, Any]] = None if force_login else load_cached_spotify_token(client_id, scopes)

    if token_data and spotify_token_still_valid(token_data):
        return str(token_data["access_token"])

    if token_data and token_data.get("refresh_token"):
        try:
            refreshed = refresh_spotify_token(str(token_data["refresh_token"]), client_id)
            refreshed["client_id"] = client_id
            refreshed["scopes"] = scopes
            refreshed["expires_at"] = int(datetime.now().timestamp()) + int(refreshed.get("expires_in", 3600))
            save_spotify_token(refreshed)
            return str(refreshed["access_token"])
        except Exception as exc:
            print(f"Spotify token refresh failed; falling back to browser login: {exc}")

    if not allow_browser_login:
        raise RuntimeError("Spotify authentication requires interactive browser login, but non-interactive auth was requested.")

    fresh = authorize_spotify_via_browser(client_id, redirect_uri, scopes)
    fresh["client_id"] = client_id
    fresh["scopes"] = scopes
    fresh["expires_at"] = int(datetime.now().timestamp()) + int(fresh.get("expires_in", 3600))
    save_spotify_token(fresh)
    return str(fresh["access_token"])


def spotify_api_get(access_token: str, endpoint_or_url: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if endpoint_or_url.startswith("http://") or endpoint_or_url.startswith("https://"):
        url = endpoint_or_url
    else:
        clean_endpoint = endpoint_or_url if endpoint_or_url.startswith("/") else f"/{endpoint_or_url}"
        url = f"{SPOTIFY_API_BASE}{clean_endpoint}"

    if params:
        query = urllib.parse.urlencode(params)
        url = f"{url}&{query}" if "?" in url else f"{url}?{query}"

    request = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = response.read().decode("utf-8")
        return json.loads(payload)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Spotify API request failed ({exc.code}) for {url}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Spotify API request failed for {url}: {exc}") from exc


def spotify_list_playlists(access_token: str) -> List[SpotifyPlaylistSummary]:
    playlists: List[SpotifyPlaylistSummary] = []
    offset = 0
    limit = 50
    total = None
    while total is None or offset < total:
        data = spotify_api_get(access_token, "/me/playlists", params={"limit": limit, "offset": offset})
        for item in data.get("items", []):
            playlist_id = str(item.get("id", "")).strip()
            if not playlist_id:
                continue
            owner = ""
            if isinstance(item.get("owner"), dict):
                owner = str(item["owner"].get("display_name") or item["owner"].get("id") or "").strip()
            tracks_total = 0
            if isinstance(item.get("tracks"), dict):
                tracks_total = int(item["tracks"].get("total") or 0)
            playlists.append(
                SpotifyPlaylistSummary(
                    id=playlist_id,
                    name=str(item.get("name", "")).strip() or playlist_id,
                    owner=owner or "unknown",
                    public=item.get("public", None),
                    tracks_total=tracks_total,
                )
            )
        total = int(data.get("total") or 0)
        offset += int(data.get("limit") or limit)
    return playlists


def resolve_playlist_id_by_name(playlists: List[SpotifyPlaylistSummary], requested_name: str) -> str:
    wanted = normalize_text(requested_name)
    if not wanted:
        raise RuntimeError("Spotify playlist name was empty.")

    exact = [p for p in playlists if normalize_text(p.name) == wanted]
    if len(exact) == 1:
        return exact[0].id
    if len(exact) > 1:
        ids = ", ".join(p.id for p in exact[:5])
        raise RuntimeError(
            f"Multiple playlists named '{requested_name}' matched. Use --spotify-playlist-id. Candidate IDs: {ids}"
        )

    partial = [p for p in playlists if wanted in normalize_text(p.name)]
    if len(partial) == 1:
        return partial[0].id
    if len(partial) > 1:
        ids = ", ".join(p.id for p in partial[:5])
        raise RuntimeError(
            f"Multiple partial playlist matches for '{requested_name}'. Use --spotify-playlist-id. Candidate IDs: {ids}"
        )

    raise RuntimeError(f"No Spotify playlist found with name like '{requested_name}'.")


def fetch_spotify_playlist_via_api(access_token: str, playlist_id: str) -> Tuple[str, str, List[SpotifyTrack]]:
    details = spotify_api_get(
        access_token,
        f"/playlists/{playlist_id}",
        params={"fields": "id,name,external_urls.spotify"},
    )
    playlist_name = str(details.get("name", "")).strip() or f"Spotify Playlist {playlist_id}"
    playlist_url = str(((details.get("external_urls") or {}).get("spotify")) or f"https://open.spotify.com/playlist/{playlist_id}")

    tracks: List[SpotifyTrack] = []
    next_url = f"{SPOTIFY_API_BASE}/playlists/{playlist_id}/tracks?limit=100"
    while next_url:
        data = spotify_api_get(access_token, next_url)
        for item in data.get("items", []):
            track = item.get("track") if isinstance(item, dict) else None
            if not isinstance(track, dict):
                continue
            if track.get("type") not in {None, "track"}:
                continue
            title = str(track.get("name", "")).strip()
            if not title:
                continue
            artist_objs = track.get("artists") if isinstance(track.get("artists"), list) else []
            artists = []
            for artist in artist_objs:
                if isinstance(artist, dict):
                    name = str(artist.get("name", "")).strip()
                    if name:
                        artists.append(name)
            tracks.append(SpotifyTrack(title=title, artists=artists))
        next_url = data.get("next") or ""

    if not tracks:
        raise RuntimeError(f"No tracks returned from Spotify API for playlist {playlist_id}.")
    return playlist_name, playlist_url, tracks


def fetch_spotify_liked_tracks_via_api(access_token: str) -> Tuple[str, str, List[SpotifyTrack]]:
    playlist_name = "Spotify Liked Songs"
    playlist_url = "https://open.spotify.com/collection/tracks"

    tracks: List[SpotifyTrack] = []
    next_url = f"{SPOTIFY_API_BASE}/me/tracks?limit=50"
    while next_url:
        data = spotify_api_get(access_token, next_url)
        for item in data.get("items", []):
            track = item.get("track") if isinstance(item, dict) else None
            if not isinstance(track, dict):
                continue
            if track.get("type") not in {None, "track"}:
                continue
            title = str(track.get("name", "")).strip()
            if not title:
                continue
            artist_objs = track.get("artists") if isinstance(track.get("artists"), list) else []
            artists = []
            for artist in artist_objs:
                if isinstance(artist, dict):
                    name = str(artist.get("name", "")).strip()
                    if name:
                        artists.append(name)
            tracks.append(SpotifyTrack(title=title, artists=artists))
        next_url = data.get("next") or ""

    if not tracks:
        raise RuntimeError("No tracks returned from Spotify liked songs.")
    return playlist_name, playlist_url, tracks


def scrape_spotify_playlist(playlist_url: str, max_scrolls: int = 350) -> Tuple[str, List[SpotifyTrack]]:
    if sync_playwright is None:
        raise RuntimeError("Missing dependency: playwright. Install with: python3 -m pip install --user playwright")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1500, "height": 1200})

        page.goto(playlist_url, wait_until="domcontentloaded", timeout=90000)
        page.wait_for_timeout(4000)

        for selector in [
            "button:has-text('Accept')",
            "button:has-text('Accept all')",
            "button[data-testid='onetrust-accept-btn-handler']",
        ]:
            try:
                page.locator(selector).first.click(timeout=1200)
            except Exception:
                pass

        try:
            page.wait_for_selector("[data-testid='tracklist-row']", timeout=25000)
        except PlaywrightTimeoutError:
            title = page.title()
            current = page.url
            browser.close()
            raise RuntimeError(
                f"Spotify tracks did not load. URL={current} title={title}. "
                "If playlist is private, make it public or share a tracklist file instead."
            )

        playlist_title = "Spotify Playlist"
        try:
            playlist_title = page.locator("h1").first.inner_text(timeout=3000).strip()
        except Exception:
            pass

        seen_keys = set()
        tracks: List[SpotifyTrack] = []

        def harvest_rows() -> None:
            rows = page.evaluate(
                """
                () => {
                  const out = [];
                  const nodes = document.querySelectorAll("[data-testid='tracklist-row']");
                  for (const row of nodes) {
                    const titleEl = row.querySelector("a[data-testid='internal-track-link']");
                    if (!titleEl) continue;
                    const title = (titleEl.textContent || "").trim();
                    if (!title) continue;
                    const artists = Array.from(row.querySelectorAll("a[href*='/artist/']"))
                      .map(a => (a.textContent || "").trim())
                      .filter(Boolean);
                    out.push({title, artists});
                  }
                  return out;
                }
                """
            )
            for row in rows:
                title = (row.get("title") or "").strip()
                artists = [a.strip() for a in (row.get("artists") or []) if a and a.strip()]
                key = f"{title}__{'|'.join(artists)}"
                if title and key not in seen_keys:
                    seen_keys.add(key)
                    tracks.append(SpotifyTrack(title=title, artists=artists))

        stagnant_rounds = 0
        previous_count = 0

        try:
            page.locator("main").hover(timeout=1500)
        except Exception:
            pass

        for _ in range(max_scrolls):
            harvest_rows()
            if len(tracks) == previous_count:
                stagnant_rounds += 1
            else:
                stagnant_rounds = 0
                previous_count = len(tracks)
            if stagnant_rounds >= 10:
                break
            page.mouse.wheel(0, 4200)
            page.wait_for_timeout(280)

        harvest_rows()
        browser.close()

        if not tracks:
            raise RuntimeError("No Spotify tracks found on the playlist page.")

        return playlist_title, tracks


def score_candidate(spotify_title: str, spotify_artists: List[str], candidate: LocalTrack) -> float:
    st = normalize_text(spotify_title)
    sa = [normalize_text(a) for a in spotify_artists if normalize_text(a)]

    title_score = fuzzy_ratio(st, candidate.norm_title) if candidate.norm_title else 0

    artist_score = 0.0
    if sa and candidate.norm_artists:
        pairs = [fuzzy_ratio(a, b) for a in sa for b in candidate.norm_artists]
        artist_score = max(pairs) if pairs else 0.0

    if sa and not candidate.norm_artists:
        artist_score = 30.0

    return (0.78 * title_score) + (0.22 * artist_score)


def build_local_index(music_root: pathlib.Path) -> Tuple[List[LocalTrack], Dict[str, List[LocalTrack]]]:
    local_tracks: List[LocalTrack] = []
    by_norm_title: Dict[str, List[LocalTrack]] = {}

    for file_path in iter_audio_files(music_root):
        track = read_local_track(file_path)
        local_tracks.append(track)
        if track.norm_title:
            by_norm_title.setdefault(track.norm_title, []).append(track)

    return local_tracks, by_norm_title


def best_match(
    spotify_track: SpotifyTrack,
    all_local_tracks: List[LocalTrack],
    by_norm_title: Dict[str, List[LocalTrack]],
    min_score: float,
) -> MatchResult:
    norm_title = normalize_text(spotify_track.title)

    candidates = list(by_norm_title.get(norm_title, []))

    if not candidates:
        first_token = norm_title.split(" ", 1)[0] if norm_title else ""
        if first_token:
            candidates = [lt for lt in all_local_tracks if lt.norm_title.startswith(first_token)]

    if not candidates:
        candidates = all_local_tracks

    # Keep matching practical on very large libraries.
    if len(candidates) > 5000:
        candidates = candidates[:5000]

    best: Optional[LocalTrack] = None
    best_score = -1.0

    for candidate in candidates:
        score = score_candidate(spotify_track.title, spotify_track.artists, candidate)
        if score > best_score:
            best_score = score
            best = candidate

    if best is None or best_score < min_score:
        return MatchResult(
            spotify_title=spotify_track.title,
            spotify_artists=spotify_track.artists,
            matched=False,
            local_path=None,
            local_title=None,
            local_artists=[],
            score=best_score if best_score >= 0 else 0.0,
        )

    return MatchResult(
        spotify_title=spotify_track.title,
        spotify_artists=spotify_track.artists,
        matched=True,
        local_path=str(best.path),
        local_title=best.title,
        local_artists=best.artists,
        score=best_score,
    )


def music_track_key(title: str, artist: str) -> str:
    return f"{normalize_text(title)}|{normalize_text(artist)}"


def list_music_playlist_track_keys(playlist_name: str) -> Set[str]:
    applescript = r'''
on run argv
  set playlistName to item 1 of argv
  set outText to ""
  set tabChar to ASCII character 9
  set lfChar to ASCII character 10
  tell application "Music"
    if not (exists user playlist playlistName) then
      return ""
    end if
    repeat with t in tracks of user playlist playlistName
      set nm to ""
      set ar to ""
      try
        set nm to (name of t) as text
      end try
      try
        set ar to (artist of t) as text
      end try
      set outText to outText & nm & tabChar & ar & lfChar
    end repeat
  end tell
  return outText
end run
'''
    proc = subprocess.run(
        ["osascript", "-e", applescript, playlist_name],
        text=True,
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0:
        return set()
    keys: Set[str] = set()
    for line in (proc.stdout or "").splitlines():
        if not line.strip():
            continue
        title, artist = (line.split("\t", 1) + [""])[:2]
        key = music_track_key(title, artist)
        if key.strip("|"):
            keys.add(key)
    return keys


def import_into_music_app(playlist_name: str, matched_paths: List[str], timeout_seconds: int) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as handle:
        temp_path = pathlib.Path(handle.name)
        for p in matched_paths:
            handle.write(p)
            handle.write("\n")

    applescript = r'''
on run argv
  set playlistName to item 1 of argv
  set pathsFile to item 2 of argv

  set fileLines to paragraphs of (read POSIX file pathsFile)

  tell application "Music"
    if exists (user playlist playlistName) then
      set targetPlaylist to user playlist playlistName
    else
      set targetPlaylist to make new user playlist with properties {name:playlistName}
    end if

    repeat with p in fileLines
      if p is not "" then
        try
          add POSIX file p to targetPlaylist
        end try
      end if
    end repeat
  end tell

  return "OK"
end run
'''

    try:
        result = subprocess.run(
            ["osascript", "-e", applescript, playlist_name, str(temp_path)],
            text=True,
            capture_output=True,
            timeout=timeout_seconds,
            check=False,
        )
    finally:
        try:
            temp_path.unlink()
        except Exception:
            pass

    if result.returncode != 0:
        raise RuntimeError(
            "Apple Music import failed. Ensure Music is installed and allow Terminal/Python to control Music in "
            "System Settings > Privacy & Security > Automation. "
            f"stderr: {result.stderr.strip()}"
        )


def find_auto_add_folder(music_root: pathlib.Path) -> pathlib.Path:
    candidates = [
        music_root / "Automatically Add to Music.localized",
        music_root / "Automatically Add to Music",
        pathlib.Path.home() / "Music/Music/Media.localized/Automatically Add to Music.localized",
        pathlib.Path.home() / "Music/Music/Media/Automatically Add to Music",
    ]
    for candidate in candidates:
        if candidate.exists() and candidate.is_dir():
            return candidate
    raise RuntimeError(
        "Could not find 'Automatically Add to Music' folder. "
        "Open Music once, then check your media folder settings in Music > Settings > Files."
    )


def import_via_autoadd(
    matched_paths: List[str],
    autoadd_dir: pathlib.Path,
    playlist_name: str,
) -> Tuple[int, int]:
    safe_playlist = slugify_filename(playlist_name)
    target_dir = autoadd_dir / f"Codex Import - {safe_playlist}"
    target_dir.mkdir(parents=True, exist_ok=True)

    copied = 0
    skipped = 0
    for idx, src_str in enumerate(matched_paths, start=1):
        src = pathlib.Path(src_str)
        if not src.exists():
            skipped += 1
            continue
        base = src.name
        dst = target_dir / base
        if dst.exists():
            # Keep existing file and avoid copying duplicates.
            skipped += 1
            continue
        if dst.suffix == "":
            dst = target_dir / f"{dst.name}{src.suffix}"
        if dst.exists():
            dst = target_dir / f"{src.stem}_{idx}{src.suffix}"
        shutil.copy2(src, dst)
        copied += 1
    return copied, skipped


def write_basic_tags(path: pathlib.Path, title: str, artists: List[str]) -> None:
    if MutagenFile is None:
        return
    try:
        mf = MutagenFile(path, easy=True)
        if not mf:
            return
        mf["title"] = [title]
        if artists:
            mf["artist"] = artists
        mf.save()
    except Exception:
        pass


def download_missing_track(track: SpotifyTrack, download_dir: pathlib.Path) -> Optional[pathlib.Path]:
    download_dir.mkdir(parents=True, exist_ok=True)

    primary_artist = track.artists[0] if track.artists else "Unknown Artist"
    base_name = slugify_filename(f"{primary_artist} - {track.title}")
    output_template = str(download_dir / f"{base_name}.%(ext)s")
    query = f"{track.title} {primary_artist} audio"

    cmd = [
        "yt-dlp",
        f"ytsearch1:{query}",
        "--no-playlist",
        "--extract-audio",
        "--audio-format",
        "m4a",
        "--audio-quality",
        "0",
        "--print",
        "after_move:filepath",
        "--output",
        output_template,
        "--extractor-args",
        "youtube:player_client=android",
        "--no-warnings",
        "--no-progress",
    ]

    proc = subprocess.run(cmd, text=True, capture_output=True, check=False)
    if proc.returncode != 0:
        return None

    lines = [ln.strip() for ln in (proc.stdout or "").splitlines() if ln.strip()]
    if not lines:
        return None

    downloaded = pathlib.Path(lines[-1]).expanduser().resolve()
    if not downloaded.exists():
        return None

    write_basic_tags(downloaded, track.title, track.artists)
    return downloaded


def default_report_path() -> pathlib.Path:
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return pathlib.Path(f"spotify_to_apple_music_report_{stamp}.json")


def main() -> int:
    parser = argparse.ArgumentParser(description="Mirror a Spotify playlist into Apple Music from local files")
    parser.add_argument(
        "spotify_playlist_url",
        nargs="?",
        default="",
        help="Public Spotify playlist URL (optional when using Spotify API mode)",
    )
    parser.add_argument(
        "--music-root",
        default="/Volumes/4 tb backup/MUSIC",
        help="Root folder containing your local audio files",
    )
    parser.add_argument("--apple-playlist-name", default="", help="Target Apple Music playlist name")
    parser.add_argument("--min-score", type=float, default=74.0, help="Minimum match score (0-100)")
    parser.add_argument(
        "--download-missing",
        action="store_true",
        help="Download unmatched tracks with yt-dlp and include them",
    )
    parser.add_argument(
        "--download-dir",
        default="",
        help="Folder for yt-dlp downloads (default: <music-root>/Spotify Imported)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Do not import into Apple Music")
    parser.add_argument("--limit", type=int, default=0, help="Only process first N Spotify tracks")
    parser.add_argument("--report", default="", help="Path to JSON report file")
    parser.add_argument(
        "--import-mode",
        choices=["applescript", "autoadd", "both"],
        default="both",
        help="How to import into Music: applescript playlist add, auto-add folder copy, or both (fallback)",
    )
    parser.add_argument(
        "--music-timeout",
        type=int,
        default=240,
        help="Timeout in seconds for AppleScript Music import before fallback",
    )
    parser.add_argument(
        "--spotify-use-api",
        action="store_true",
        help="Use Spotify Web API instead of Playwright page scraping",
    )
    parser.add_argument(
        "--spotify-client-id",
        default=os.environ.get("SPOTIFY_CLIENT_ID", ""),
        help="Spotify app client ID (or set SPOTIFY_CLIENT_ID)",
    )
    parser.add_argument(
        "--spotify-redirect-uri",
        default=os.environ.get("SPOTIFY_REDIRECT_URI", SPOTIFY_DEFAULT_REDIRECT_URI),
        help=f"Spotify OAuth redirect URI (default: {SPOTIFY_DEFAULT_REDIRECT_URI})",
    )
    parser.add_argument(
        "--spotify-scopes",
        default=SPOTIFY_DEFAULT_SCOPES,
        help=f"Spotify OAuth scopes (default: '{SPOTIFY_DEFAULT_SCOPES}')",
    )
    parser.add_argument(
        "--spotify-force-login",
        action="store_true",
        help="Ignore cached Spotify token and force fresh browser login",
    )
    parser.add_argument(
        "--non-interactive-auth",
        action="store_true",
        help="Fail instead of opening a browser if cached Spotify auth is missing or expired.",
    )
    parser.add_argument(
        "--spotify-playlist-id",
        default="",
        help="Spotify playlist ID (or full playlist URL / spotify:playlist URI)",
    )
    parser.add_argument(
        "--spotify-playlist-name",
        default="",
        help="Find Spotify playlist by name from your account playlists (API mode)",
    )
    parser.add_argument(
        "--list-spotify-playlists",
        action="store_true",
        help="List your Spotify playlists and exit unless a playlist target is also provided",
    )
    parser.add_argument(
        "--spotify-liked-songs",
        action="store_true",
        help="Use your Spotify Liked Songs (/me/tracks) as the source (API mode)",
    )

    args = parser.parse_args()

    use_spotify_api = bool(
        args.spotify_use_api
        or args.list_spotify_playlists
        or args.spotify_playlist_id
        or args.spotify_playlist_name
        or args.spotify_liked_songs
    )
    spotify_source_mode = "scrape"
    playlist_id = ""
    spotify_playlist_url = args.spotify_playlist_url.strip()
    spotify_tracks: List[SpotifyTrack]
    playlist_title: str

    if use_spotify_api:
        client_id = args.spotify_client_id.strip()
        if not client_id:
            print(
                "Spotify API mode requires --spotify-client-id (or SPOTIFY_CLIENT_ID env var).",
                file=sys.stderr,
            )
            return 2

        scopes = args.spotify_scopes.strip() or SPOTIFY_DEFAULT_SCOPES
        access_token = get_spotify_access_token(
            client_id=client_id,
            redirect_uri=args.spotify_redirect_uri.strip(),
            scopes=scopes,
            force_login=args.spotify_force_login,
            allow_browser_login=not args.non_interactive_auth,
        )

        playlists_cache: Optional[List[SpotifyPlaylistSummary]] = None
        if args.list_spotify_playlists or args.spotify_playlist_name:
            playlists_cache = spotify_list_playlists(access_token)

        if args.list_spotify_playlists:
            print("\nSpotify playlists")
            if not playlists_cache:
                print("No playlists returned.")
            else:
                for idx, pl in enumerate(playlists_cache, start=1):
                    visibility = "public" if pl.public is True else ("private" if pl.public is False else "unknown")
                    print(f"[{idx}] {pl.name} | id={pl.id} | tracks={pl.tracks_total} | {visibility} | owner={pl.owner}")
            if not (args.spotify_playlist_id or args.spotify_playlist_name or args.spotify_playlist_url or args.spotify_liked_songs):
                return 0

        if args.spotify_liked_songs:
            playlist_id = "liked_songs"
            print("Fetching Spotify liked songs via API")
            playlist_title, spotify_playlist_url, spotify_tracks = fetch_spotify_liked_tracks_via_api(access_token)
            spotify_source_mode = "api"
        else:
            playlist_id = extract_spotify_playlist_id(args.spotify_playlist_id)
            if not playlist_id and spotify_playlist_url:
                playlist_id = extract_spotify_playlist_id(spotify_playlist_url)
            if not playlist_id and args.spotify_playlist_name:
                if playlists_cache is None:
                    playlists_cache = spotify_list_playlists(access_token)
                playlist_id = resolve_playlist_id_by_name(playlists_cache, args.spotify_playlist_name)
                print(f"Resolved playlist name '{args.spotify_playlist_name}' -> {playlist_id}")

            if not playlist_id:
                print(
                    "Spotify API mode needs a playlist target: provide --spotify-playlist-id, "
                    "--spotify-playlist-name, a playlist URL, or --spotify-liked-songs.",
                    file=sys.stderr,
                )
                return 2

            print(f"Fetching Spotify playlist via API: {playlist_id}")
            playlist_title, spotify_playlist_url, spotify_tracks = fetch_spotify_playlist_via_api(access_token, playlist_id)
            spotify_source_mode = "api"
    else:
        if not spotify_playlist_url:
            print("Missing Spotify playlist URL. Provide a URL or use --spotify-use-api options.", file=sys.stderr)
            return 2
        playlist_id = extract_spotify_playlist_id(spotify_playlist_url)
        print(f"Scraping Spotify playlist: {spotify_playlist_url}")
        playlist_title, spotify_tracks = scrape_spotify_playlist(spotify_playlist_url)

    music_root = pathlib.Path(args.music_root).expanduser().resolve()
    if args.limit > 0:
        spotify_tracks = spotify_tracks[: args.limit]

    print(f"Spotify playlist title: {playlist_title}")
    print(f"Spotify tracks found: {len(spotify_tracks)}")

    local_tracks: List[LocalTrack] = []
    by_norm_title: Dict[str, List[LocalTrack]] = {}
    music_root_available = music_root.exists() and music_root.is_dir()
    if music_root_available:
        print(f"Indexing local files under: {music_root}")
        local_tracks, by_norm_title = build_local_index(music_root)
        print(f"Local audio files indexed: {len(local_tracks)}")
    else:
        print(f"Music root not found: {music_root}")

    if not local_tracks and not args.download_missing:
        print(
            "No local audio files found and --download-missing is disabled. "
            "Connect your library drive or enable --download-missing.",
            file=sys.stderr,
        )
        return 3
    if not local_tracks and args.download_missing:
        print("No local audio files found; continuing in download-missing-only mode.")

    results: List[MatchResult] = []
    for i, st in enumerate(spotify_tracks, start=1):
        if local_tracks:
            result = best_match(st, local_tracks, by_norm_title, min_score=args.min_score)
        else:
            result = MatchResult(
                spotify_title=st.title,
                spotify_artists=st.artists,
                matched=False,
                local_path=None,
                local_title=None,
                local_artists=[],
                score=0.0,
            )
        results.append(result)
        if result.matched:
            print(f"[{i}] MATCH  {st.title} -> {pathlib.Path(result.local_path).name} ({result.score:.1f})")
        else:
            if local_tracks:
                print(f"[{i}] MISS   {st.title} ({', '.join(st.artists)})")
            else:
                print(f"[{i}] MISS   {st.title} ({', '.join(st.artists)}) [no local index]")

    matched_paths = [r.local_path for r in results if r.matched and r.local_path]
    misses = [r for r in results if not r.matched]
    downloaded_count = 0

    if args.download_missing and misses:
        if args.download_dir:
            download_dir = pathlib.Path(args.download_dir).expanduser().resolve()
        else:
            default_root = music_root if music_root_available else (pathlib.Path.home() / "Music")
            download_dir = default_root / "Spotify Imported"
        print(f"Downloading missing tracks with yt-dlp to: {download_dir}")
        for idx, result in enumerate(results):
            if result.matched:
                continue
            spotify_track = spotify_tracks[idx]
            downloaded_path = download_missing_track(spotify_track, download_dir)
            if not downloaded_path:
                continue
            downloaded_count += 1
            results[idx] = MatchResult(
                spotify_title=spotify_track.title,
                spotify_artists=spotify_track.artists,
                matched=True,
                local_path=str(downloaded_path),
                local_title=spotify_track.title,
                local_artists=spotify_track.artists,
                score=100.0,
            )
            print(f"[{idx+1}] DL     {spotify_track.title} -> {downloaded_path.name}")

        matched_paths = [r.local_path for r in results if r.matched and r.local_path]
        misses = [r for r in results if not r.matched]

    apple_playlist_name = args.apple_playlist_name.strip() or playlist_title
    existing_playlist_keys: Set[str] = set()
    skipped_already_in_playlist = 0

    # Deduplicate import list by path, then skip tracks already present in target playlist.
    deduped_results: List[MatchResult] = []
    seen_paths: Set[str] = set()
    for r in results:
        if not r.matched or not r.local_path:
            continue
        if r.local_path in seen_paths:
            continue
        seen_paths.add(r.local_path)
        deduped_results.append(r)

    if not args.dry_run:
        existing_playlist_keys = list_music_playlist_track_keys(apple_playlist_name)
        if existing_playlist_keys:
            print(f"Existing tracks in '{apple_playlist_name}': {len(existing_playlist_keys)}")

    filtered_paths: List[str] = []
    for r in deduped_results:
        title = (r.local_title or r.spotify_title or "").strip()
        artist = ""
        if r.local_artists:
            artist = r.local_artists[0]
        elif r.spotify_artists:
            artist = r.spotify_artists[0]
        key = music_track_key(title, artist)
        if existing_playlist_keys and key in existing_playlist_keys:
            skipped_already_in_playlist += 1
            continue
        filtered_paths.append(r.local_path)
        if key.strip("|"):
            existing_playlist_keys.add(key)
    matched_paths = filtered_paths

    report_path = pathlib.Path(args.report) if args.report else default_report_path()
    report = {
        "spotify_source_mode": spotify_source_mode,
        "spotify_playlist_url": spotify_playlist_url,
        "spotify_playlist_id": playlist_id,
        "spotify_playlist_title": playlist_title,
        "apple_playlist_name": apple_playlist_name,
        "music_root": str(music_root),
        "match_threshold": args.min_score,
        "total_spotify_tracks": len(spotify_tracks),
        "matched_count": len(matched_paths),
        "missed_count": len(misses),
        "downloaded_missing_count": downloaded_count,
        "skipped_already_in_playlist_count": skipped_already_in_playlist,
        "results": [asdict(r) for r in results],
    }
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print("\nSummary")
    print(f"Matched: {len(matched_paths)}")
    print(f"Missed:  {len(misses)}")
    if skipped_already_in_playlist:
        print(f"Skipped already in playlist: {skipped_already_in_playlist}")
    if args.download_missing:
        print(f"Downloaded missing: {downloaded_count}")
    print(f"Report:  {report_path.resolve()}")

    if not matched_paths:
        print("No matched/downloaded files available for import.")
        return 0

    if not args.dry_run:
        if args.import_mode == "applescript":
            print(f"Importing matched files into Apple Music playlist: {apple_playlist_name} (AppleScript)")
            import_into_music_app(apple_playlist_name, matched_paths, timeout_seconds=args.music_timeout)
            print("Apple Music import complete.")
        elif args.import_mode == "autoadd":
            autoadd_dir = find_auto_add_folder(music_root)
            print(f"Queueing matched files into auto-add folder: {autoadd_dir}")
            copied, skipped = import_via_autoadd(matched_paths, autoadd_dir, apple_playlist_name)
            print(f"Auto-add queued. copied={copied} skipped={skipped}")
        else:
            try:
                print(f"Importing matched files into Apple Music playlist: {apple_playlist_name} (AppleScript)")
                import_into_music_app(apple_playlist_name, matched_paths, timeout_seconds=args.music_timeout)
                print("Apple Music import complete.")
            except Exception as exc:
                print(f"AppleScript import failed/timed out: {exc}")
                autoadd_dir = find_auto_add_folder(music_root)
                print(f"Falling back to auto-add folder: {autoadd_dir}")
                copied, skipped = import_via_autoadd(matched_paths, autoadd_dir, apple_playlist_name)
                print(f"Auto-add queued. copied={copied} skipped={skipped}")
    else:
        print("Dry-run mode: skipped Apple Music import.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
