from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import secrets
import shlex
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime
from pathlib import Path
from shutil import copy2

from flask import Flask, Response, jsonify, redirect, render_template, request, send_from_directory, session, url_for
from mutagen import File as MutagenFile
from mutagen.id3 import APIC, ID3, TALB, TCON, TIT2, TPE1, ID3NoHeaderError
from werkzeug.utils import secure_filename


BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads" / "originals"
EXPORT_DIR = BASE_DIR / "exports" / "cleaned"
THUMBNAIL_DIR = BASE_DIR / "exports" / "thumbnails"
AUDIO_EXTENSIONS = {".mp3", ".m4a", ".aac", ".wav", ".aiff", ".flac", ".ogg"}
VIDEO_EXTENSIONS = {".mp4", ".m4v", ".mov", ".avi", ".mkv"}
ALLOWED_EXTENSIONS = AUDIO_EXTENSIONS | VIDEO_EXTENSIONS
TRACKED_UPLOADS: dict[str, dict[str, str | dict[str, str] | float]] = {}
FFMPEG_BIN = "ffmpeg"
FFPROBE_BIN = "ffprobe"
SCRIPT_DIR = BASE_DIR / "scripts"
IPOD_CONFIG_SCRIPT = SCRIPT_DIR / "ipod_project_config.sh"
IPOD_STAGE_SCRIPT = SCRIPT_DIR / "ipod_stage_all.sh"
IPOD_RESUME_SCRIPT = SCRIPT_DIR / "ipod_resume_pipeline.sh"
DEFAULT_IPOD_TARGET_VOLUME = "/Volumes/4 tb backup"
DEFAULT_IPOD_PROJECT_ROOT = f"{DEFAULT_IPOD_TARGET_VOLUME}/codex ipod ready 500gb"
SPOTIFY_SESSION_DIR = BASE_DIR / ".spotify_sessions"
SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE = "https://api.spotify.com/v1"
SPOTIFY_DEFAULT_CLIENT_ID = "1fd5039188e3488b940933da79591fe1"
SPOTIFY_DEFAULT_SCOPES = (
    "playlist-read-private "
    "playlist-read-collaborative "
    "user-follow-read "
    "user-library-read "
    "streaming "
    "user-read-playback-state "
    "user-read-currently-playing "
    "user-modify-playback-state"
)
SPOTIFY_DEFAULT_REDIRECT_PATH = "/spotify/callback"
SPOTIFY_USER_AGENT = "swagpods-spotify-connect/1.0"

AUDIO_FIELD_MAP = {
    "title": ("title", TIT2),
    "artist": ("artist", TPE1),
    "album": ("album", TALB),
    "genre": ("genre", TCON),
}
VIDEO_METADATA_FIELDS = (
    "title",
    "show",
    "episodeTitle",
    "seasonNumber",
    "episodeNumber",
    "artist",
)
DEVICE_PRESETS = {
    "ipod-classic-5g": {
        "label": "iPod Classic 5th Gen",
        "width": 320,
        "height": 240,
        "video_bitrate": 700,
        "audio_bitrate": 128,
        "profile": "baseline",
        "level": "1.3",
    },
    "ipod-classic-5-5g": {
        "label": "iPod Classic 5.5th Gen",
        "width": 320,
        "height": 240,
        "video_bitrate": 800,
        "audio_bitrate": 160,
        "profile": "baseline",
        "level": "1.3",
    },
    "ipod-classic-6g": {
        "label": "iPod Classic 6th Gen",
        "width": 640,
        "height": 480,
        "video_bitrate": 1400,
        "audio_bitrate": 160,
        "profile": "main",
        "level": "3.0",
    },
    "ipod-classic-7g": {
        "label": "iPod Classic 7th Gen",
        "width": 640,
        "height": 480,
        "video_bitrate": 1600,
        "audio_bitrate": 192,
        "profile": "main",
        "level": "3.0",
    },
    "ipod-nano": {
        "label": "iPod Nano",
        "width": 320,
        "height": 240,
        "video_bitrate": 700,
        "audio_bitrate": 128,
        "profile": "baseline",
        "level": "1.3",
    },
    "ipod-video": {
        "label": "iPod Video",
        "width": 320,
        "height": 240,
        "video_bitrate": 700,
        "audio_bitrate": 160,
        "profile": "baseline",
        "level": "1.3",
    },
}
VIDEO_QUALITY_FACTORS = {
    "standard": 1.0,
    "high": 1.3,
}


app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or os.environ.get("SECRET_KEY") or "dev-only-change-me"
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("SESSION_COOKIE_SECURE", "0") == "1"
SYNC_LOCK = threading.Lock()
SYNC_PROCESS: subprocess.Popen[str] | None = None
SYNC_PROCESS_KIND: str | None = None
SYNC_STATE = {
    "state": "no_device",
    "headline": "Connect iPod to sync",
    "subheadline": "",
    "actionLabel": "",
    "canStart": False,
    "busy": False,
    "sticky": False,
    "detail": "",
}
SYNC_ENV_CACHE = {
    "timestamp": 0.0,
    "value": {
        "deviceDetected": False,
        "deviceName": "",
        "bridgeReady": False,
        "targetVolumeReady": False,
        "pipelineScriptReady": False,
        "mediaCount": 0,
        "targetVolume": DEFAULT_IPOD_TARGET_VOLUME,
        "projectRoot": DEFAULT_IPOD_PROJECT_ROOT,
    },
}


def log_spotify_playback(message: str, **details: object) -> None:
    payload = {
        key: value
        for key, value in details.items()
        if value is not None and value != ""
    }
    if payload:
        app.logger.info("[spotify-playback] %s %s", message, json.dumps(payload, sort_keys=True))
        return
    app.logger.info("[spotify-playback] %s", message)


def ensure_directories() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)
    SPOTIFY_SESSION_DIR.mkdir(parents=True, exist_ok=True)


def _b64url_no_padding(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def get_app_base_url() -> str:
    configured = os.environ.get("APP_BASE_URL", "").strip().rstrip("/")
    if configured:
        return configured
    return request.url_root.rstrip("/")


def get_spotify_oauth_config() -> dict[str, str]:
    # Set these env vars in your Render/local environment:
    # - SPOTIFY_CLIENT_ID: client ID from your Spotify developer app
    # - SPOTIFY_REDIRECT_URI: exact callback URL registered in Spotify dashboard
    # - SPOTIFY_SCOPES: space-delimited scopes to request
    redirect_uri = os.environ.get("SPOTIFY_REDIRECT_URI", "").strip()
    if not redirect_uri:
        redirect_uri = f"{get_app_base_url()}{SPOTIFY_DEFAULT_REDIRECT_PATH}"

    configured_scopes = os.environ.get("SPOTIFY_SCOPES", "").strip()
    requested_scopes = {
        scope
        for scope in f"{configured_scopes} {SPOTIFY_DEFAULT_SCOPES}".split()
        if scope
    }

    return {
        "clientId": os.environ.get("SPOTIFY_CLIENT_ID", "").strip() or SPOTIFY_DEFAULT_CLIENT_ID,
        "redirectUri": redirect_uri,
        "scopes": " ".join(sorted(requested_scopes)) or SPOTIFY_DEFAULT_SCOPES,
    }


def get_session_id() -> str:
    session_id = str(session.get("app_session_id", "")).strip()
    if session_id:
        return session_id
    session_id = uuid.uuid4().hex
    session["app_session_id"] = session_id
    return session_id


def get_spotify_session_path() -> Path:
    return SPOTIFY_SESSION_DIR / f"{get_session_id()}.json"


def load_spotify_session_data() -> dict[str, object]:
    payload = session.get("spotify_session_data")
    if isinstance(payload, dict):
        return payload
    path = get_spotify_session_path()
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def save_spotify_session_data(payload: dict[str, object]) -> None:
    session["spotify_session_data"] = payload
    path = get_spotify_session_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def clear_spotify_session_data() -> None:
    session.pop("spotify_session_data", None)
    path = get_spotify_session_path()
    if path.exists():
        try:
            path.unlink()
        except OSError:
            pass


def normalize_spotify_session_payload(
    payload: dict[str, object], previous: dict[str, object] | None = None
) -> dict[str, object]:
    previous_payload = dict(previous or {})
    normalized_payload = dict(previous_payload)
    now_timestamp = int(datetime.now().timestamp())

    def get_string(*keys: str) -> str:
        for key in keys:
            value = payload.get(key, previous_payload.get(key))
            if value is None:
                continue
            normalized_value = str(value).strip()
            if normalized_value:
                return normalized_value
        return ""

    def get_int(*keys: str) -> int:
        for key in keys:
            value = payload.get(key, previous_payload.get(key))
            if value is None or value == "":
                continue
            try:
                return int(value)
            except (TypeError, ValueError):
                continue
        return 0

    access_token = get_string("access_token", "accessToken")
    refresh_token = get_string("refresh_token", "refreshToken")
    token_type = get_string("token_type", "tokenType")
    scope = get_string("scope", "scopes")
    profile_name = get_string("profile_name", "profileName")
    profile_image_url = get_string("profile_image_url", "profileImageUrl")
    expires_at = get_int("expires_at", "expiresAt")

    if expires_at > 10_000_000_000:
        expires_at //= 1000
    if expires_at <= 0:
        expires_in = get_int("expires_in", "expiresIn")
        if expires_in > 0:
            expires_at = now_timestamp + expires_in

    if access_token:
        normalized_payload["access_token"] = access_token
    if refresh_token:
        normalized_payload["refresh_token"] = refresh_token
    if token_type:
        normalized_payload["token_type"] = token_type
    if expires_at > 0:
        normalized_payload["expires_at"] = expires_at
    if scope:
        normalized_payload["scope"] = scope
        normalized_payload["scopes"] = scope
    if profile_name:
        normalized_payload["profile_name"] = profile_name
    if profile_image_url:
        normalized_payload["profile_image_url"] = profile_image_url
    return normalized_payload


def load_spotify_oauth_pending() -> dict[str, str]:
    payload = session.get("spotify_oauth_pending")
    if not isinstance(payload, dict):
        return {}
    return {
        "state": str(payload.get("state", "")).strip(),
        "code_verifier": str(payload.get("code_verifier", "")).strip(),
        "redirect_uri": str(payload.get("redirect_uri", "")).strip(),
    }


def save_spotify_oauth_pending(payload: dict[str, str]) -> None:
    session["spotify_oauth_pending"] = {
        "state": str(payload.get("state", "")).strip(),
        "code_verifier": str(payload.get("code_verifier", "")).strip(),
        "redirect_uri": str(payload.get("redirect_uri", "")).strip(),
    }


def clear_spotify_oauth_pending() -> None:
    session.pop("spotify_oauth_pending", None)


def spotify_is_configured() -> bool:
    return bool(get_spotify_oauth_config()["clientId"])


def spotify_token_request(form_data: dict[str, str]) -> dict[str, object]:
    encoded = urllib.parse.urlencode(form_data).encode("utf-8")
    request_obj = urllib.request.Request(
        SPOTIFY_TOKEN_URL,
        data=encoded,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=30) as response:
            payload = response.read().decode("utf-8")
        data = json.loads(payload)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(
            f"Spotify token request failed ({exc.code}). Check SPOTIFY_REDIRECT_URI and your Spotify app settings. {detail}"
        ) from exc

    if "access_token" not in data:
        raise RuntimeError("Spotify token response did not contain an access token.")

    expires_in = int(data.get("expires_in", 3600) or 3600)
    data["expires_at"] = int(datetime.now().timestamp()) + expires_in
    return data


def refresh_spotify_access_token(refresh_token: str, client_id: str) -> dict[str, object]:
    refreshed = spotify_token_request(
        {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": client_id,
        }
    )
    refreshed["refresh_token"] = refresh_token
    return refreshed


def spotify_api_get(access_token: str, endpoint_or_url: str, params: dict[str, object] | None = None) -> dict[str, object]:
    return spotify_api_request(access_token, "GET", endpoint_or_url, params=params)


def spotify_api_request(
    access_token: str,
    method: str,
    endpoint_or_url: str,
    params: dict[str, object] | None = None,
    body: dict[str, object] | None = None,
) -> dict[str, object]:
    if endpoint_or_url.startswith("http://") or endpoint_or_url.startswith("https://"):
        url = endpoint_or_url
        if params:
            url = f"{url}{'&' if '?' in url else '?'}{urllib.parse.urlencode(params)}"
    else:
        url = f"{SPOTIFY_API_BASE}{endpoint_or_url}"
        if params:
            url = f"{url}?{urllib.parse.urlencode(params)}"

    payload_bytes = None
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "User-Agent": SPOTIFY_USER_AGENT,
    }
    if body is not None:
        payload_bytes = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request_obj = urllib.request.Request(
        url,
        data=payload_bytes,
        headers=headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=30) as response:
            payload = response.read().decode("utf-8")
        return json.loads(payload) if payload else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Spotify API request failed ({exc.code}). {detail}") from exc


def get_valid_spotify_access_token() -> str:
    config = get_spotify_oauth_config()
    session_data = load_spotify_session_data()
    access_token = str(session_data.get("access_token", "")).strip()
    expires_at = int(session_data.get("expires_at", 0) or 0)
    if access_token and expires_at > int(datetime.now().timestamp()) + 60:
        return access_token

    refresh_token = str(session_data.get("refresh_token", "")).strip()
    if not refresh_token or not config["clientId"]:
        raise RuntimeError("Spotify session is missing or expired.")

    refreshed = refresh_spotify_access_token(refresh_token, config["clientId"])
    session_data.update(refreshed)
    save_spotify_session_data(session_data)
    return str(refreshed["access_token"])


def fetch_spotify_profile_and_playlists() -> tuple[dict[str, object], list[dict[str, object]]]:
    access_token = get_valid_spotify_access_token()
    profile = spotify_api_get(access_token, "/me")
    playlists: list[dict[str, object]] = []
    next_url = f"{SPOTIFY_API_BASE}/me/playlists?limit=50"
    while next_url:
        payload = spotify_api_get(access_token, next_url)
        for item in payload.get("items", []):
            if not isinstance(item, dict):
                continue
            playlists.append(build_spotify_playlist_payload(item))
        next_url = str(payload.get("next") or "")
    return profile, playlists


def paginate_spotify_items(access_token: str, initial_url: str) -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    next_url = initial_url
    while next_url:
        payload = spotify_api_get(access_token, next_url)
        for item in payload.get("items", []):
            if isinstance(item, dict):
                items.append(item)
        next_url = str(payload.get("next") or "")
    return items


def build_spotify_album_payload(album: dict[str, object]) -> dict[str, object]:
    artist_names: list[str] = []
    for artist in album.get("artists") or []:
        if isinstance(artist, dict):
            name = str(artist.get("name", "")).strip()
            if name:
                artist_names.append(name)

    artwork_url = ""
    for image in album.get("images") or []:
        if isinstance(image, dict):
            maybe_url = str(image.get("url", "")).strip()
            if maybe_url:
                artwork_url = maybe_url
                break

    return {
        "id": str(album.get("id", "")).strip(),
        "name": str(album.get("name", "")).strip() or "Untitled Album",
        "artist": ", ".join(artist_names),
        "trackCount": int(album.get("total_tracks", 0) or 0),
        "spotifyUrl": str(((album.get("external_urls") or {}).get("spotify")) or "").strip(),
        "artworkUrl": artwork_url,
        "uri": str(album.get("uri", "")).strip(),
    }


def build_spotify_artist_payload(artist: dict[str, object]) -> dict[str, object]:
    return {
        "id": str(artist.get("id", "")).strip(),
        "name": str(artist.get("name", "")).strip() or "Unknown Artist",
        "spotifyUrl": str(((artist.get("external_urls") or {}).get("spotify")) or "").strip(),
        "uri": str(artist.get("uri", "")).strip(),
    }


def get_spotify_playlist_item_total(item: dict[str, object]) -> int:
    for key in ("items", "tracks"):
        payload = item.get(key)
        if isinstance(payload, dict):
            return int(payload.get("total", 0) or 0)
    return 0


def build_spotify_playlist_payload(item: dict[str, object]) -> dict[str, object]:
    owner = item.get("owner") if isinstance(item.get("owner"), dict) else {}
    images = item.get("images") if isinstance(item.get("images"), list) else []
    artwork_url = ""
    for image in images:
        if isinstance(image, dict):
            maybe_url = str(image.get("url", "")).strip()
            if maybe_url:
                artwork_url = maybe_url
                break
    return {
        "id": str(item.get("id", "")).strip(),
        "name": str(item.get("name", "")).strip() or "Untitled Playlist",
        "trackCount": get_spotify_playlist_item_total(item),
        "spotifyUrl": str(((item.get("external_urls") or {}).get("spotify")) or "").strip(),
        "ownerName": str(owner.get("display_name") or owner.get("id") or "").strip(),
        "artworkUrl": artwork_url,
        "uri": str(item.get("uri", "")).strip(),
    }


def fetch_spotify_library_sections() -> dict[str, object]:
    access_token = get_valid_spotify_access_token()
    profile, playlists = fetch_spotify_profile_and_playlists()
    warnings: list[str] = []

    try:
        album_items = paginate_spotify_items(access_token, f"{SPOTIFY_API_BASE}/me/albums?limit=50")
    except RuntimeError as error:
        album_items = []
        warnings.append(str(error))

    try:
        saved_track_items = paginate_spotify_items(access_token, f"{SPOTIFY_API_BASE}/me/tracks?limit=50")
    except RuntimeError as error:
        saved_track_items = []
        warnings.append(str(error))

    albums = [
        build_spotify_album_payload(item["album"])
        for item in album_items
        if isinstance(item.get("album"), dict)
    ]
    tracks = [
        build_spotify_track_payload(item["track"])
        for item in saved_track_items
        if isinstance(item.get("track"), dict)
    ]

    artist_index: dict[str, dict[str, object]] = {}
    for album_item in album_items:
        album = album_item.get("album")
        if not isinstance(album, dict):
            continue
        for artist in album.get("artists") or []:
            if not isinstance(artist, dict):
                continue
            artist_id = str(artist.get("id", "")).strip()
            if not artist_id or artist_id in artist_index:
                continue
            artist_index[artist_id] = build_spotify_artist_payload(artist)

    return {
        "profileName": str(profile.get("display_name") or profile.get("id") or "Spotify User").strip(),
        "playlists": playlists,
        "albums": albums,
        "artists": sorted(artist_index.values(), key=lambda item: str(item["name"]).lower()),
        "tracks": tracks,
        "warnings": warnings,
    }


def extract_spotify_track_from_collection_item(item: dict[str, object]) -> dict[str, object] | None:
    if not isinstance(item, dict):
        return None
    for key in ("item", "track"):
        candidate = item.get(key)
        if isinstance(candidate, dict) and str(candidate.get("type", "track")).strip() in {"", "track"}:
            return candidate
    return None


def fetch_spotify_playlist_tracks(playlist_id: str) -> dict[str, object]:
    access_token = get_valid_spotify_access_token()
    details = spotify_api_get(access_token, f"/playlists/{playlist_id}")
    items = paginate_spotify_items(access_token, f"{SPOTIFY_API_BASE}/playlists/{playlist_id}/items?limit=50")
    tracks = [
        build_spotify_track_payload(track)
        for item in items
        if (track := extract_spotify_track_from_collection_item(item)) is not None
    ]
    return {
        "id": playlist_id,
        "name": str(details.get("name", "")).strip() or "Playlist",
        "spotifyUrl": str(((details.get("external_urls") or {}).get("spotify")) or "").strip(),
        "tracks": tracks,
        "uri": str(details.get("uri", "")).strip(),
    }


def fetch_spotify_album_tracks(album_id: str) -> dict[str, object]:
    access_token = get_valid_spotify_access_token()
    album = spotify_api_get(access_token, f"/albums/{album_id}")
    tracks = [
        {
            **build_spotify_track_payload({**track, "album": album}),
            "uri": str(track.get("uri", "")).strip(),
        }
        for track in ((album.get("tracks") or {}).get("items") or [])
        if isinstance(track, dict)
    ]
    return {
        "id": album_id,
        "name": str(album.get("name", "")).strip() or "Album",
        "artist": ", ".join(
            str(artist.get("name", "")).strip()
            for artist in album.get("artists") or []
            if isinstance(artist, dict) and str(artist.get("name", "")).strip()
        ),
        "spotifyUrl": str(((album.get("external_urls") or {}).get("spotify")) or "").strip(),
        "tracks": tracks,
        "uri": str(album.get("uri", "")).strip(),
    }


def fetch_spotify_artist_view(artist_id: str) -> dict[str, object]:
    access_token = get_valid_spotify_access_token()
    artist = spotify_api_get(access_token, f"/artists/{artist_id}")
    albums_payload = paginate_spotify_items(
        access_token,
        f"{SPOTIFY_API_BASE}/artists/{artist_id}/albums?include_groups=album,single&limit=50",
    )
    albums: list[dict[str, object]] = []
    seen_album_ids: set[str] = set()
    for album in albums_payload:
        album_id = str(album.get("id", "")).strip()
        if not album_id or album_id in seen_album_ids:
            continue
        seen_album_ids.add(album_id)
        albums.append(build_spotify_album_payload(album))
    return {
        "id": artist_id,
        "name": str(artist.get("name", "")).strip() or "Artist",
        "spotifyUrl": str(((artist.get("external_urls") or {}).get("spotify")) or "").strip(),
        "albums": albums,
    }


def build_spotify_track_payload(track: dict[str, object]) -> dict[str, object]:
    album_obj = track.get("album") if isinstance(track.get("album"), dict) else {}
    artist_names: list[str] = []
    for artist in track.get("artists") or []:
        if isinstance(artist, dict):
            name = str(artist.get("name", "")).strip()
            if name:
                artist_names.append(name)

    artwork_url = ""
    for image in album_obj.get("images") or []:
        if isinstance(image, dict):
            maybe_url = str(image.get("url", "")).strip()
            if maybe_url:
                artwork_url = maybe_url
                break

    return {
        "id": str(track.get("id", "")).strip(),
        "title": str(track.get("name", "")).strip(),
        "artist": ", ".join(artist_names),
        "album": str(album_obj.get("name", "")).strip(),
        "durationMs": int(track.get("duration_ms", 0) or 0),
        "artworkUrl": artwork_url,
        "spotifyUrl": str(((track.get("external_urls") or {}).get("spotify")) or "").strip(),
        "uri": str(track.get("uri", "")).strip(),
    }


def fetch_spotify_player_state_payload() -> dict[str, object]:
    access_token = get_valid_spotify_access_token()
    playback = spotify_api_request(access_token, "GET", "/me/player")
    if not playback:
        return {
            "connected": True,
            "hasActiveDevice": False,
            "isPlaying": False,
            "progressMs": 0,
            "deviceName": "",
            "deviceType": "",
            "deviceId": "",
            "contextUri": "",
            "shuffleEnabled": False,
            "track": None,
        }

    device = playback.get("device") if isinstance(playback.get("device"), dict) else {}
    context = playback.get("context") if isinstance(playback.get("context"), dict) else {}
    item = playback.get("item") if isinstance(playback.get("item"), dict) else {}
    return {
        "connected": True,
        "hasActiveDevice": bool(device),
        "isPlaying": bool(playback.get("is_playing")),
        "progressMs": int(playback.get("progress_ms", 0) or 0),
        "deviceName": str(device.get("name", "")).strip(),
        "deviceType": str(device.get("type", "")).strip(),
        "deviceId": str(device.get("id", "")).strip(),
        "contextUri": str(context.get("uri", "")).strip(),
        "shuffleEnabled": bool(playback.get("shuffle_state")),
        "track": build_spotify_track_payload(item) if item else None,
    }


def fetch_spotify_devices(access_token: str) -> list[dict[str, object]]:
    payload = spotify_api_get(access_token, "/me/player/devices")
    return [item for item in payload.get("devices", []) if isinstance(item, dict)]


def filter_spotify_available_devices(devices: list[dict[str, object]]) -> list[dict[str, object]]:
    return [
        item
        for item in devices
        if str(item.get("id", "")).strip() and not bool(item.get("is_restricted"))
    ]


def wait_for_spotify_device(
    access_token: str,
    device_id: str,
    *,
    require_active: bool = False,
    attempts: int = 8,
    delay_seconds: float = 0.35,
) -> dict[str, object] | None:
    normalized_device_id = str(device_id).strip()
    if not normalized_device_id:
        return None

    for attempt in range(attempts):
        devices = filter_spotify_available_devices(fetch_spotify_devices(access_token))
        match = next(
            (
                item
                for item in devices
                if str(item.get("id", "")).strip() == normalized_device_id
            ),
            None,
        )
        if match and (not require_active or bool(match.get("is_active"))):
            return match
        if attempt < attempts - 1:
            time.sleep(delay_seconds)
    return None


def fetch_spotify_devices_payload() -> list[dict[str, object]]:
    access_token = get_valid_spotify_access_token()
    payload = {"devices": fetch_spotify_devices(access_token)}
    devices: list[dict[str, object]] = []
    for item in payload.get("devices", []):
        if not isinstance(item, dict):
            continue
        devices.append(
            {
                "id": str(item.get("id", "")).strip(),
                "isActive": bool(item.get("is_active")),
                "isRestricted": bool(item.get("is_restricted")),
                "name": str(item.get("name", "")).strip(),
                "type": str(item.get("type", "")).strip(),
            }
        )
    return devices


def transfer_spotify_playback(access_token: str, device_id: str, *, play: bool = False) -> None:
    log_spotify_playback("transfer requested", deviceId=device_id, play=play)
    spotify_api_request(
        access_token,
        "PUT",
        "/me/player",
        body={"device_ids": [device_id], "play": play},
    )
    time.sleep(0.35)


def ensure_spotify_target_device(access_token: str, preferred_device_id: str = "") -> str:
    available = filter_spotify_available_devices(fetch_spotify_devices(access_token))

    preferred = next(
        (
            item
            for item in available
            if str(item.get("id", "")).strip() == preferred_device_id
        ),
        None,
    )
    if not preferred and preferred_device_id:
        log_spotify_playback("waiting for preferred device", preferredDeviceId=preferred_device_id)
        preferred = wait_for_spotify_device(access_token, preferred_device_id)
        if preferred:
            available = filter_spotify_available_devices(fetch_spotify_devices(access_token))

    if preferred:
        preferred_id = str(preferred.get("id", "")).strip()
        if not bool(preferred.get("is_active")):
            log_spotify_playback(
                "transferring playback to preferred device",
                preferredDeviceId=preferred_id,
                deviceName=str(preferred.get("name", "")).strip(),
                deviceType=str(preferred.get("type", "")).strip(),
            )
            transfer_spotify_playback(access_token, preferred_id, play=False)
            active_preferred = wait_for_spotify_device(access_token, preferred_id, require_active=True)
            if not active_preferred:
                raise RuntimeError("SwagPods could not activate the selected Spotify device.")
        return preferred_id

    if not available:
        raise RuntimeError(
            "Select a playback device in Spotify to start music."
        )

    active = next((item for item in available if bool(item.get("is_active"))), None)
    if active:
        return str(active.get("id", "")).strip()

    fallback = next(
        (
            item
            for item in available
            if str(item.get("type", "")).strip().lower() in {"computer", "smartphone"}
        ),
        available[0],
    )
    device_id = str(fallback.get("id", "")).strip()
    log_spotify_playback(
        "transferring playback to fallback device",
        deviceId=device_id,
        deviceName=str(fallback.get("name", "")).strip(),
        deviceType=str(fallback.get("type", "")).strip(),
    )
    transfer_spotify_playback(access_token, device_id, play=False)
    active_fallback = wait_for_spotify_device(access_token, device_id, require_active=True)
    if not active_fallback:
        raise RuntimeError("SwagPods could not activate a Spotify playback device.")
    return device_id


def get_spotify_status_payload() -> dict[str, object]:
    config = get_spotify_oauth_config()
    status: dict[str, object] = {
        "configured": bool(config["clientId"]),
        "connected": False,
        "profileName": "",
        "profileImageUrl": "",
        "playlists": [],
        "error": "",
        "scopes": config["scopes"],
    }

    if not status["configured"]:
        status["error"] = "Spotify is not configured yet. Add SPOTIFY_CLIENT_ID and SPOTIFY_REDIRECT_URI."
        return status

    session_data = load_spotify_session_data()
    if not session_data:
        return status

    # Treat a stored token session as connected even if profile hydration fails.
    # This avoids dropping back into the Connect Spotify loop on transient API errors
    # and lets the UI surface the actual Spotify error instead.
    status["connected"] = True
    status["profileName"] = str(session_data.get("profile_name", "")).strip()

    try:
        profile, playlists = fetch_spotify_profile_and_playlists()
    except RuntimeError as error:
        status["error"] = str(error)
        return status

    images = profile.get("images") if isinstance(profile.get("images"), list) else []
    image_url = ""
    for image in images:
        if isinstance(image, dict):
            maybe_url = str(image.get("url", "")).strip()
            if maybe_url:
                image_url = maybe_url
                break

    status["profileName"] = str(profile.get("display_name") or profile.get("id") or "Spotify User").strip()
    status["profileImageUrl"] = image_url
    status["playlists"] = playlists
    status["webPlaybackSupported"] = True
    session_data["profile_name"] = status["profileName"]
    if image_url:
        session_data["profile_image_url"] = image_url
    save_spotify_session_data(session_data)
    return status


def get_static_asset_version() -> int:
    static_files = [
        BASE_DIR / "static" / "app.js",
        BASE_DIR / "static" / "styles.css",
    ]
    existing_files = [path for path in static_files if path.exists()]
    if not existing_files:
        return 0
    return max(int(path.stat().st_mtime) for path in existing_files)


def get_ipod_sync_config() -> dict[str, str]:
    config = {
        "targetVolume": os.environ.get("IPOD_TARGET_VOLUME", DEFAULT_IPOD_TARGET_VOLUME),
        "projectRoot": os.environ.get("IPOD_PROJECT_ROOT", DEFAULT_IPOD_PROJECT_ROOT),
        "pipelineLog": os.environ.get("IPOD_PIPELINE_LOG", str(Path.home() / ".codex" / "ipod-supervisor" / "stage_pipeline.log")),
        "screenName": os.environ.get("IPOD_SCREEN_NAME", "ipod_500gb"),
    }

    if not IPOD_CONFIG_SCRIPT.exists():
        return config

    result = subprocess.run(
        [
            "/bin/bash",
            "-lc",
            (
                f"source {shlex.quote(str(IPOD_CONFIG_SCRIPT))} >/dev/null 2>&1; "
                'printf "targetVolume=%s\\nprojectRoot=%s\\npipelineLog=%s\\nscreenName=%s\\n" '
                '"${IPOD_TARGET_VOLUME:-}" "${IPOD_PROJECT_ROOT:-}" "${IPOD_PIPELINE_LOG:-}" "${IPOD_SCREEN_NAME:-}"'
            ),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return config

    for line in (result.stdout or "").splitlines():
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        if value.strip():
            config[key] = value.strip()

    return config


def count_syncable_media() -> int:
    return len(list(EXPORT_DIR.glob("*.mp3"))) + len(list(EXPORT_DIR.glob("*.mp4")))


def is_converter_running(screen_name: str) -> bool:
    result = subprocess.run(
        ["/usr/bin/env", "screen", "-ls"],
        capture_output=True,
        text=True,
        check=False,
    )
    screen_listing = result.stdout or ""
    return f".{screen_name}" in screen_listing


def detect_connected_ipod_device() -> tuple[bool, str]:
    if sys.platform != "darwin":
        return False, ""

    usb_result = subprocess.run(
        ["system_profiler", "SPUSBDataType", "-detailLevel", "mini"],
        capture_output=True,
        text=True,
        check=False,
    )
    usb_output = usb_result.stdout or ""
    match = re.search(r"^\s*([^\n]*iPod[^\n]*):\s*$", usb_output, flags=re.IGNORECASE | re.MULTILINE)
    if match:
        return True, match.group(1).strip()

    volumes_dir = Path("/Volumes")
    if volumes_dir.exists():
        for volume in volumes_dir.iterdir():
            if "ipod" in volume.name.lower():
                return True, volume.name

    return False, ""


def get_sync_environment(force: bool = False) -> dict[str, object]:
    now = time.monotonic()
    if not force and (now - float(SYNC_ENV_CACHE["timestamp"])) < 1.5:
        return dict(SYNC_ENV_CACHE["value"])

    config = get_ipod_sync_config()
    device_detected, device_name = detect_connected_ipod_device()
    target_volume = Path(config["targetVolume"])
    project_root = Path(config["projectRoot"])
    pipeline_ready = IPOD_STAGE_SCRIPT.exists()
    resume_ready = IPOD_RESUME_SCRIPT.exists()
    screen_name = config["screenName"] or "ipod_500gb"
    env = {
        "deviceDetected": device_detected,
        "deviceName": device_name or "iPod",
        "bridgeReady": pipeline_ready and target_volume.exists(),
        "targetVolumeReady": target_volume.exists(),
        "pipelineScriptReady": pipeline_ready,
        "resumeScriptReady": resume_ready,
        "converterRunning": is_converter_running(screen_name) if target_volume.exists() else False,
        "mediaCount": count_syncable_media(),
        "targetVolume": str(target_volume),
        "projectRoot": str(project_root),
        "pipelineLog": str(config["pipelineLog"]),
        "screenName": screen_name,
    }
    SYNC_ENV_CACHE["timestamp"] = now
    SYNC_ENV_CACHE["value"] = dict(env)
    return env


def set_sync_state(
    state: str,
    headline: str,
    subheadline: str = "",
    *,
    action_label: str = "",
    can_start: bool = False,
    busy: bool = False,
    sticky: bool = False,
    detail: str = "",
) -> None:
    SYNC_STATE.update(
        {
            "state": state,
            "headline": headline,
            "subheadline": subheadline,
            "actionLabel": action_label,
            "canStart": can_start,
            "busy": busy,
            "sticky": sticky,
            "detail": detail,
        }
    )


def launch_ipod_sync_pipeline() -> subprocess.Popen[str]:
    return subprocess.Popen(
        ["/bin/bash", str(IPOD_STAGE_SCRIPT)],
        cwd=BASE_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
        text=True,
    )


def launch_ipod_resume_pipeline() -> subprocess.Popen[str]:
    return subprocess.Popen(
        ["/bin/bash", str(IPOD_RESUME_SCRIPT)],
        cwd=BASE_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
        text=True,
    )


def get_sync_payload(force_env: bool = False) -> dict[str, object]:
    global SYNC_PROCESS, SYNC_PROCESS_KIND

    env = get_sync_environment(force=force_env)
    with SYNC_LOCK:
        if SYNC_PROCESS is not None:
            returncode = SYNC_PROCESS.poll()
            if returncode is None:
                if SYNC_PROCESS_KIND == "resume":
                    if bool(env["converterRunning"]):
                        SYNC_PROCESS = None
                        SYNC_PROCESS_KIND = None
                        set_sync_state(
                            "syncing",
                            "Converter Running",
                            "External SSD is active",
                            can_start=False,
                            busy=True,
                            sticky=True,
                        )
                    else:
                        set_sync_state(
                            "syncing",
                            "Resuming converter...",
                            "External SSD pipeline starting",
                            can_start=False,
                            busy=True,
                            sticky=True,
                        )
                elif not bool(env["deviceDetected"]):
                    try:
                        SYNC_PROCESS.terminate()
                    except OSError:
                        pass
                    SYNC_PROCESS = None
                    SYNC_PROCESS_KIND = None
                    set_sync_state(
                        "error",
                        "Sync failed",
                        "iPod disconnected",
                        action_label="Retry Sync",
                        can_start=False,
                        sticky=True,
                        detail="disconnected",
                    )
                else:
                    set_sync_state(
                        "syncing",
                        "Syncing...",
                        "Please wait...",
                        can_start=False,
                        busy=True,
                        sticky=True,
                    )
            else:
                process_kind = SYNC_PROCESS_KIND
                SYNC_PROCESS = None
                SYNC_PROCESS_KIND = None
                if returncode == 0 and process_kind == "resume":
                    if bool(env["converterRunning"]):
                        set_sync_state(
                            "syncing",
                            "Converter Running",
                            "External SSD is active",
                            can_start=False,
                            busy=True,
                            sticky=True,
                        )
                    elif bool(env["targetVolumeReady"]) and bool(env["resumeScriptReady"]):
                        set_sync_state(
                            "ready",
                            "External SSD Ready",
                            "Press center to resume converter",
                            action_label="Resume Converter",
                            can_start=True,
                            busy=False,
                            sticky=False,
                        )
                    else:
                        set_sync_state("no_device", "Connect iPod to sync")
                elif returncode == 0:
                    set_sync_state(
                        "success",
                        "Synced",
                        "OK to Disconnect",
                        can_start=False,
                        sticky=True,
                    )
                else:
                    if process_kind == "resume":
                        set_sync_state(
                            "error",
                            "Resume failed",
                            "Please try again",
                            action_label="Resume Converter" if bool(env["targetVolumeReady"]) and bool(env["resumeScriptReady"]) else "",
                            can_start=bool(env["targetVolumeReady"]) and bool(env["resumeScriptReady"]),
                            sticky=True,
                        )
                    else:
                        set_sync_state(
                            "error",
                            "Sync failed",
                            "Please try again",
                            action_label="Retry Sync" if bool(env["deviceDetected"]) else "",
                            can_start=bool(env["deviceDetected"]),
                            sticky=True,
                        )
        elif SYNC_STATE["state"] == "success":
            if not bool(env["deviceDetected"]):
                set_sync_state("no_device", "Connect iPod to sync")
        elif SYNC_STATE["state"] == "error":
            if not bool(env["deviceDetected"]) and SYNC_STATE.get("detail") != "disconnected":
                set_sync_state("no_device", "Connect iPod to sync")
        else:
            if not bool(env["deviceDetected"]):
                if bool(env["converterRunning"]):
                    set_sync_state(
                        "syncing",
                        "Converter Running",
                        "External SSD is active",
                        can_start=False,
                        busy=True,
                        sticky=True,
                    )
                elif bool(env["targetVolumeReady"]) and bool(env["resumeScriptReady"]):
                    set_sync_state(
                        "ready",
                        "External SSD Ready",
                        "Press center to resume converter",
                        action_label="Resume Converter",
                        can_start=True,
                        busy=False,
                        sticky=False,
                    )
                else:
                    set_sync_state("no_device", "Connect iPod to sync")
            else:
                media_count = int(env["mediaCount"])
                media_text = "Library ready" if media_count == 0 else f"{media_count} item{'s' if media_count != 1 else ''} ready"
                set_sync_state(
                    "ready",
                    "iPod Connected",
                    media_text,
                    action_label="Sync Now",
                    can_start=True,
                )

        return {
            "state": SYNC_STATE["state"],
            "headline": SYNC_STATE["headline"],
            "subheadline": SYNC_STATE["subheadline"],
            "actionLabel": SYNC_STATE["actionLabel"],
            "canStart": SYNC_STATE["canStart"],
            "busy": SYNC_STATE["busy"],
            "deviceDetected": env["deviceDetected"],
            "deviceName": env["deviceName"],
            "mediaCount": env["mediaCount"],
        }


def allowed_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


def suffix_for_media_type(media_type: str) -> str:
    return ".mp3" if media_type == "audio" else ".mp4"


def normalize_filename_text(value: str) -> str:
    cleaned = re.sub(r"[_\.]+", " ", value)
    return re.sub(r"\s+", " ", cleaned).strip()


def best_guess_audio_from_filename(filename: str) -> dict[str, str]:
    stem = normalize_filename_text(Path(filename).stem)
    if not stem:
        return {"title": "", "artist": "", "album": "", "genre": ""}

    parts = [part.strip() for part in re.split(r"\s+-\s+", stem) if part.strip()]
    guessed = {"title": "", "artist": "", "album": "", "genre": ""}

    if len(parts) == 1:
        guessed["title"] = parts[0]
    elif len(parts) == 2:
        guessed["artist"] = parts[0]
        guessed["title"] = parts[1]
    else:
        guessed["artist"] = parts[0]
        guessed["album"] = parts[1]
        guessed["title"] = " - ".join(parts[2:])

    return guessed


def best_guess_video_from_filename(filename: str) -> dict[str, str]:
    stem = normalize_filename_text(Path(filename).stem)
    guessed = {field: "" for field in VIDEO_METADATA_FIELDS}
    if not stem:
        return guessed

    episode_match = re.match(
        r"(?P<show>.+?)\s+[Ss](?P<season>\d{1,2})[Ee](?P<episode>\d{1,2})(?:\s*-\s*(?P<title>.+))?$",
        stem,
    )
    if episode_match:
        guessed["show"] = episode_match.group("show").strip()
        guessed["seasonNumber"] = episode_match.group("season")
        guessed["episodeNumber"] = episode_match.group("episode")
        guessed["episodeTitle"] = (episode_match.group("title") or "").strip()
        guessed["title"] = guessed["episodeTitle"] or stem
        return guessed

    guessed["title"] = stem
    return guessed


def ffprobe_data(file_path: Path) -> dict:
    result = subprocess.run(
        [
            FFPROBE_BIN,
            "-v",
            "error",
            "-show_entries",
            "format:stream",
            "-of",
            "json",
            str(file_path),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return {}

    try:
        return json.loads(result.stdout or "{}")
    except json.JSONDecodeError:
        return {}


def detect_media_type(file_path: Path, original_name: str) -> str:
    suffix = Path(original_name).suffix.lower()
    if suffix in VIDEO_EXTENSIONS:
        return "video"
    if suffix in AUDIO_EXTENSIONS:
        return "audio"

    probe = ffprobe_data(file_path)
    for stream in probe.get("streams", []):
        codec_type = stream.get("codec_type")
        if codec_type == "video":
            return "video"
        if codec_type == "audio":
            return "audio"

    return "audio"


def read_audio_metadata(file_path: Path, original_name: str) -> tuple[dict[str, str], list[str]]:
    metadata = {field: "" for field in AUDIO_FIELD_MAP}
    inferred_fields: list[str] = []

    audio = MutagenFile(file_path, easy=True)
    if audio and audio.tags:
        for field, (tag_name, _) in AUDIO_FIELD_MAP.items():
            values = audio.tags.get(tag_name, [])
            if values:
                metadata[field] = values[0].strip()

    guessed = best_guess_audio_from_filename(original_name)
    for field, value in guessed.items():
        if value and not metadata[field]:
            metadata[field] = value
            inferred_fields.append(field)

    return metadata, inferred_fields


def read_video_metadata(file_path: Path, original_name: str) -> tuple[dict[str, str], list[str]]:
    metadata = {field: "" for field in VIDEO_METADATA_FIELDS}
    inferred_fields: list[str] = []
    probe = ffprobe_data(file_path)
    format_tags = {key.lower(): value for key, value in (probe.get("format", {}).get("tags", {}) or {}).items()}

    metadata["title"] = str(format_tags.get("title", "")).strip()
    metadata["show"] = str(format_tags.get("show", "") or format_tags.get("album", "")).strip()
    metadata["episodeTitle"] = str(format_tags.get("episode_id", "")).strip()
    metadata["seasonNumber"] = str(format_tags.get("season_number", "")).strip()
    metadata["episodeNumber"] = str(format_tags.get("episode_sort", "")).strip()
    metadata["artist"] = str(format_tags.get("artist", "")).strip()

    guessed = best_guess_video_from_filename(original_name)
    for field, value in guessed.items():
        if value and not metadata[field]:
            metadata[field] = value
            inferred_fields.append(field)

    return metadata, inferred_fields


def read_media_metadata(
    file_path: Path,
    original_name: str,
    media_type: str,
) -> tuple[dict[str, str], list[str]]:
    if media_type == "video":
        return read_video_metadata(file_path, original_name)
    return read_audio_metadata(file_path, original_name)


def clean_metadata(payload: dict[str, str], media_type: str) -> dict[str, str]:
    fields = VIDEO_METADATA_FIELDS if media_type == "video" else AUDIO_FIELD_MAP.keys()
    return {field: str(payload.get(field, "")).strip() for field in fields}


def build_output_path(original_name: str, media_type: str) -> Path:
    stem = secure_filename(Path(original_name).stem) or "cleaned-track"
    candidate = EXPORT_DIR / f"{stem}_cleaned{suffix_for_media_type(media_type)}"
    index = 1

    while candidate.exists():
        candidate = EXPORT_DIR / f"{stem}_cleaned_{index}{suffix_for_media_type(media_type)}"
        index += 1

    return candidate


def write_audio_metadata(file_path: Path, metadata: dict[str, str]) -> None:
    try:
        tags = ID3(file_path)
    except ID3NoHeaderError:
        tags = ID3()

    for field, (_, frame_cls) in AUDIO_FIELD_MAP.items():
        frame_id = frame_cls.__name__
        tags.delall(frame_id)
        value = metadata[field]
        if value:
            tags.add(frame_cls(encoding=3, text=[value]))

    tags.save(file_path)


def copy_audio_artwork(source_path: Path, output_path: Path) -> None:
    artwork = get_embedded_artwork(source_path)
    if not artwork:
        return

    artwork_bytes, mime_type = artwork
    try:
        tags = ID3(output_path)
    except ID3NoHeaderError:
        tags = ID3()

    tags.delall("APIC")
    tags.add(APIC(encoding=3, mime=mime_type, type=3, desc="Cover", data=artwork_bytes))
    tags.save(output_path)


def build_audio_ffmpeg_metadata_args(metadata: dict[str, str]) -> list[str]:
    args: list[str] = []
    for field, (tag_name, _) in AUDIO_FIELD_MAP.items():
        value = metadata.get(field, "")
        if value:
            args.extend(["-metadata", f"{tag_name}={value}"])
    return args


def build_video_ffmpeg_metadata_args(metadata: dict[str, str]) -> list[str]:
    mappings = {
        "title": "title",
        "show": "show",
        "episodeTitle": "episode_id",
        "seasonNumber": "season_number",
        "episodeNumber": "episode_sort",
        "artist": "artist",
    }
    args: list[str] = []
    for field, tag_name in mappings.items():
        value = metadata.get(field, "")
        if value:
            args.extend(["-metadata", f"{tag_name}={value}"])
    return args


def run_ffmpeg(command: list[str], error_message: str) -> None:
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        stderr_text = (result.stderr or "").strip()
        raise RuntimeError(f"{error_message} {stderr_text}".strip())


def get_media_duration_seconds(file_path: Path) -> float:
    probe = ffprobe_data(file_path)
    format_info = probe.get("format", {})
    try:
        return float(format_info.get("duration", 0.0) or 0.0)
    except (TypeError, ValueError):
        return 0.0


def convert_audio_file(
    source_path: Path,
    output_path: Path,
    metadata: dict[str, str],
    preset_key: str,
) -> None:
    preset = DEVICE_PRESETS.get(preset_key, DEVICE_PRESETS["ipod-classic-5-5g"])
    command = [
        FFMPEG_BIN,
        "-y",
        "-i",
        str(source_path),
        "-map_metadata",
        "-1",
        "-vn",
        "-c:a",
        "libmp3lame",
        "-b:a",
        f"{preset['audio_bitrate']}k",
        *build_audio_ffmpeg_metadata_args(metadata),
        str(output_path),
    ]
    run_ffmpeg(command, "Audio conversion failed.")
    write_audio_metadata(output_path, metadata)
    copy_audio_artwork(source_path, output_path)


def build_thumbnail_path(output_path: Path) -> Path:
    stem = secure_filename(output_path.stem) or "converted-media"
    return THUMBNAIL_DIR / f"{stem}.jpg"


def generate_video_thumbnail(source_path: Path, thumbnail_path: Path) -> None:
    command = [
        FFMPEG_BIN,
        "-y",
        "-i",
        str(source_path),
        "-vf",
        "thumbnail,scale=320:-1",
        "-frames:v",
        "1",
        str(thumbnail_path),
    ]
    run_ffmpeg(command, "Thumbnail generation failed.")


def convert_video_file(
    source_path: Path,
    output_path: Path,
    metadata: dict[str, str],
    preset_key: str,
    quality_key: str,
) -> Path:
    preset = DEVICE_PRESETS.get(preset_key, DEVICE_PRESETS["ipod-classic-5-5g"])
    quality_factor = VIDEO_QUALITY_FACTORS.get(quality_key, VIDEO_QUALITY_FACTORS["standard"])
    width = preset["width"]
    height = preset["height"]
    video_bitrate = int(preset["video_bitrate"] * quality_factor)
    maxrate = int(video_bitrate * 1.15)
    bufsize = int(video_bitrate * 2)
    audio_bitrate = int(preset["audio_bitrate"])
    filter_graph = (
        f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
        f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black"
    )

    command = [
        FFMPEG_BIN,
        "-y",
        "-i",
        str(source_path),
        "-map_metadata",
        "-1",
        "-vf",
        filter_graph,
        "-r",
        "30",
        "-c:v",
        "libx264",
        "-profile:v",
        str(preset["profile"]),
        "-level:v",
        str(preset["level"]),
        "-pix_fmt",
        "yuv420p",
        "-b:v",
        f"{video_bitrate}k",
        "-maxrate",
        f"{maxrate}k",
        "-bufsize",
        f"{bufsize}k",
        "-c:a",
        "aac",
        "-b:a",
        f"{audio_bitrate}k",
        "-movflags",
        "+faststart",
        *build_video_ffmpeg_metadata_args(metadata),
        str(output_path),
    ]
    run_ffmpeg(command, "Video conversion failed.")
    thumbnail_path = build_thumbnail_path(output_path)
    generate_video_thumbnail(output_path, thumbnail_path)
    return thumbnail_path


def get_embedded_artwork(file_path: Path) -> tuple[bytes, str] | None:
    try:
        tags = ID3(file_path)
    except ID3NoHeaderError:
        return None

    artwork_frames = tags.getall("APIC")
    if not artwork_frames:
        return None

    artwork = artwork_frames[0]
    mime_type = artwork.mime or "image/jpeg"
    return artwork.data, mime_type


def categorize_content(filename: str, metadata: dict[str, str], duration_seconds: float) -> str:
    searchable_text = " ".join(
        [
            filename,
            metadata.get("title", ""),
            metadata.get("artist", ""),
            metadata.get("album", ""),
            metadata.get("genre", ""),
        ]
    ).lower()

    podcast_markers = [
        "podcast",
        "episode",
        "ep.",
        "ep ",
        "show",
        "interview",
        "radio",
    ]
    audiobook_markers = [
        "audiobook",
        "chapter",
        "chapters",
        "book ",
        "book-",
        "part ",
        "part-",
    ]

    if any(marker in searchable_text for marker in audiobook_markers):
        return "Audiobook"

    if any(marker in searchable_text for marker in podcast_markers):
        return "Podcast"

    if duration_seconds >= 30 * 60:
        if any(marker in searchable_text for marker in ["story", "novel", "author", "narrat"]):
            return "Audiobook"
        return "Podcast"

    return "Music"


def build_library_song(file_path: Path) -> dict[str, str]:
    metadata, _ = read_audio_metadata(file_path, file_path.name)
    duration_seconds = get_media_duration_seconds(file_path)
    category = categorize_content(file_path.name, metadata, duration_seconds)
    return {
        "id": file_path.name,
        "fileName": file_path.name,
        "title": metadata["title"],
        "artist": metadata["artist"],
        "album": metadata["album"],
        "category": category,
        "durationSeconds": duration_seconds,
        "playbackUrl": f"/exports/cleaned/{file_path.name}",
        "downloadUrl": f"/exports/cleaned/{file_path.name}",
        "artworkUrl": (
            f"/exports/cleaned/{file_path.name}/artwork"
            if get_embedded_artwork(file_path)
            else None
        ),
    }


def build_video_result_metadata(metadata: dict[str, str]) -> dict[str, str]:
    return {
        "title": metadata.get("title", ""),
        "show": metadata.get("show", ""),
        "episodeTitle": metadata.get("episodeTitle", ""),
        "seasonNumber": metadata.get("seasonNumber", ""),
        "episodeNumber": metadata.get("episodeNumber", ""),
        "artist": metadata.get("artist", ""),
    }


@app.route("/")
def index():
    ensure_directories()
    spotify_config = get_spotify_oauth_config()
    return render_template(
        "index.html",
        export_dir=str(EXPORT_DIR),
        upload_dir=str(UPLOAD_DIR),
        asset_version=get_static_asset_version(),
        spotify_client_id=spotify_config["clientId"],
        spotify_redirect_uri=spotify_config["redirectUri"],
        spotify_scopes=spotify_config["scopes"],
        spotify_auth_state=str(request.args.get("spotify", "")).strip(),
        spotify_auth_error=str(request.args.get("spotify_error", "")).strip(),
        spotify_auth_code=str(request.args.get("spotify_code", "")).strip(),
        spotify_auth_callback_state=str(request.args.get("spotify_state", "")).strip(),
    )


@app.post("/api/upload")
def upload_file():
    ensure_directories()
    uploaded_file = request.files.get("file")

    if not uploaded_file or not uploaded_file.filename:
        return jsonify({"error": "Choose one file to upload."}), 400

    if not allowed_file(uploaded_file.filename):
        return jsonify({"error": "Only common audio and video files are supported in this proof of concept."}), 400

    original_name = secure_filename(uploaded_file.filename)
    token = uuid.uuid4().hex
    stored_name = f"{token}_{original_name}"
    stored_path = UPLOAD_DIR / stored_name
    uploaded_file.save(stored_path)

    media_type = detect_media_type(stored_path, uploaded_file.filename)
    metadata, inferred_fields = read_media_metadata(stored_path, uploaded_file.filename, media_type)
    duration_seconds = get_media_duration_seconds(stored_path)
    TRACKED_UPLOADS[token] = {
        "original_name": uploaded_file.filename,
        "stored_path": str(stored_path),
        "media_type": media_type,
        "duration_seconds": duration_seconds,
    }

    return jsonify(
        {
            "token": token,
            "originalName": uploaded_file.filename,
            "mediaType": media_type,
            "metadata": metadata,
            "inferredFields": inferred_fields,
            "durationSeconds": duration_seconds,
            "defaultOptimizeFor": "ipod-classic-5-5g",
            "defaultQuality": "standard",
            "uploadPath": str(stored_path),
        }
    )


@app.post("/api/export")
def export_file():
    ensure_directories()
    payload = request.get_json(silent=True) or {}
    token = str(payload.get("token", "")).strip()

    if not token or token not in TRACKED_UPLOADS:
        return jsonify({"error": "Upload a file before exporting."}), 400

    upload_record = TRACKED_UPLOADS[token]
    source_path = Path(upload_record["stored_path"])
    if not source_path.exists():
        return jsonify({"error": "The uploaded source file is no longer available."}), 400

    media_type = str(upload_record.get("media_type", "audio"))
    metadata = clean_metadata(payload.get("metadata", {}), media_type)
    output_path = build_output_path(upload_record["original_name"], media_type)
    conversion_options = payload.get("conversionOptions", {}) or payload.get("videoOptions", {}) or {}
    preset_key = str(conversion_options.get("optimizeFor", "ipod-classic-5-5g")).strip() or "ipod-classic-5-5g"

    if media_type == "video":
        quality_key = str(conversion_options.get("quality", "standard")).strip() or "standard"
        try:
            thumbnail_path = convert_video_file(source_path, output_path, metadata, preset_key, quality_key)
        except RuntimeError as error:
            return jsonify({"error": str(error)}), 400

        duration_seconds = get_media_duration_seconds(output_path)
        preset = DEVICE_PRESETS.get(preset_key, DEVICE_PRESETS["ipod-classic-5-5g"])
        return jsonify(
            {
                "message": "Compatible iPod video exported successfully.",
                "savedPath": str(output_path),
                "savedDir": str(EXPORT_DIR),
                "fileName": output_path.name,
                "mediaType": "video",
                "durationSeconds": duration_seconds,
                "downloadUrl": f"/exports/cleaned/{output_path.name}",
                "artworkUrl": f"/exports/thumbnails/{thumbnail_path.name}" if thumbnail_path.exists() else None,
                "metadata": build_video_result_metadata(metadata),
                "presetLabel": preset["label"],
            }
        )

    try:
        convert_audio_file(source_path, output_path, metadata, preset_key)
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 400

    duration_seconds = get_media_duration_seconds(output_path)
    category = categorize_content(upload_record["original_name"], metadata, duration_seconds)
    preset = DEVICE_PRESETS.get(preset_key, DEVICE_PRESETS["ipod-classic-5-5g"])
    return jsonify(
        {
            "message": "iPod-ready audio exported successfully.",
            "savedPath": str(output_path),
            "savedDir": str(EXPORT_DIR),
            "fileName": output_path.name,
            "mediaType": "audio",
            "category": category,
            "durationSeconds": duration_seconds,
            "playbackUrl": f"/exports/cleaned/{output_path.name}",
            "downloadUrl": f"/exports/cleaned/{output_path.name}",
            "presetLabel": preset["label"],
            "artworkUrl": (
                f"/exports/cleaned/{output_path.name}/artwork"
                if get_embedded_artwork(output_path)
                else None
            ),
            "metadata": metadata,
        }
    )


@app.get("/api/library")
def get_library():
    ensure_directories()
    songs = [
        build_library_song(file_path)
        for file_path in sorted(EXPORT_DIR.glob("*.mp3"), key=lambda path: path.stat().st_mtime)
    ]
    return jsonify({"songs": songs})


@app.get("/api/spotify/status")
def get_spotify_status():
    ensure_directories()
    return jsonify(get_spotify_status_payload())


@app.get("/api/spotify/library")
def get_spotify_library():
    ensure_directories()
    try:
        return jsonify(fetch_spotify_library_sections())
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 400


@app.get("/api/spotify/playlists/<playlist_id>")
def get_spotify_playlist_detail(playlist_id: str):
    ensure_directories()
    try:
        return jsonify(fetch_spotify_playlist_tracks(playlist_id))
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 400


@app.get("/api/spotify/albums/<album_id>")
def get_spotify_album_detail(album_id: str):
    ensure_directories()
    try:
        return jsonify(fetch_spotify_album_tracks(album_id))
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 400


@app.get("/api/spotify/artists/<artist_id>")
def get_spotify_artist_detail(artist_id: str):
    ensure_directories()
    try:
        return jsonify(fetch_spotify_artist_view(artist_id))
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 400


@app.post("/api/spotify/connect")
def start_spotify_connect():
    ensure_directories()
    config = get_spotify_oauth_config()
    if not config["clientId"]:
        return jsonify({"error": "Spotify is not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_REDIRECT_URI."}), 400

    verifier = _b64url_no_padding(secrets.token_bytes(48))
    challenge = _b64url_no_padding(hashlib.sha256(verifier.encode("ascii")).digest())
    state = secrets.token_urlsafe(24)

    params = {
        "client_id": config["clientId"],
        "response_type": "code",
        "redirect_uri": config["redirectUri"],
        "scope": config["scopes"],
        "code_challenge_method": "S256",
        "code_challenge": challenge,
        "state": state,
    }
    save_spotify_oauth_pending(
        {
            "state": state,
            "code_verifier": verifier,
            "redirect_uri": config["redirectUri"],
        }
    )
    authorize_url = f"{SPOTIFY_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return jsonify(
        {
            "authorizeUrl": authorize_url,
            "redirectUri": config["redirectUri"],
        }
    )


@app.post("/api/spotify/exchange")
def spotify_exchange_code():
    ensure_directories()
    config = get_spotify_oauth_config()
    payload = request.get_json(silent=True) or {}
    code = str(payload.get("code", "")).strip()
    callback_state = str(payload.get("state", "")).strip()
    pending = load_spotify_oauth_pending()
    verifier = str(payload.get("codeVerifier", "")).strip() or pending.get("code_verifier", "")
    redirect_uri = str(payload.get("redirectUri", "")).strip() or pending.get("redirect_uri", "") or config["redirectUri"]

    if not code or not verifier:
        return jsonify({"error": "Missing Spotify authorization code or PKCE verifier."}), 400
    if callback_state and pending.get("state") and callback_state != pending.get("state"):
        clear_spotify_oauth_pending()
        return jsonify({"error": "Spotify sign-in state did not match. Try Connect Spotify again."}), 400

    try:
        token_data = spotify_token_request(
            {
                "client_id": config["clientId"],
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "code_verifier": verifier,
            }
        )
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 400

    session_data = normalize_spotify_session_payload(token_data, load_spotify_session_data())
    save_spotify_session_data(session_data)
    clear_spotify_oauth_pending()
    return jsonify(token_data)


@app.post("/api/spotify/session/restore")
def restore_spotify_session():
    ensure_directories()
    payload = request.get_json(silent=True) or {}
    session_data = normalize_spotify_session_payload(payload, load_spotify_session_data())
    has_access_token = bool(str(session_data.get("access_token", "")).strip())
    has_refresh_token = bool(str(session_data.get("refresh_token", "")).strip())
    if not has_access_token and not has_refresh_token:
        return jsonify({"error": "Missing Spotify token data."}), 400

    save_spotify_session_data(session_data)
    log_spotify_playback(
        "session restored",
        hasAccessToken=has_access_token,
        hasRefreshToken=has_refresh_token,
        expiresAt=int(session_data.get("expires_at", 0) or 0),
    )
    return jsonify(
        {
            "ok": True,
            "hasAccessToken": has_access_token,
            "hasRefreshToken": has_refresh_token,
            "expiresAt": int(session_data.get("expires_at", 0) or 0),
            "profileName": str(session_data.get("profile_name", "")).strip(),
        }
    )


@app.get("/spotify/callback")
def spotify_callback():
    ensure_directories()
    error_value = str(request.args.get("error", "")).strip()
    if error_value:
        return redirect(url_for("index", spotify="error", spotify_error=f"Spotify authorization failed: {error_value}"))

    code = str(request.args.get("code", "")).strip()
    state = str(request.args.get("state", "")).strip()
    if not code or not state:
        return redirect(url_for("index", spotify="error", spotify_error="Spotify callback validation failed. Try connecting again."))
    return redirect(url_for("index", spotify="callback", spotify_code=code, spotify_state=state))


@app.post("/api/spotify/disconnect")
def disconnect_spotify():
    ensure_directories()
    clear_spotify_session_data()
    clear_spotify_oauth_pending()
    return jsonify({"ok": True})


@app.get("/api/spotify/player")
def get_spotify_player():
    ensure_directories()
    try:
        return jsonify(fetch_spotify_player_state_payload())
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 400


@app.get("/api/spotify/web-playback-token")
def get_spotify_web_playback_token():
    ensure_directories()
    try:
        access_token = get_valid_spotify_access_token()
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 400
    return jsonify({"accessToken": access_token})


@app.post("/api/spotify/player/command")
def spotify_player_command():
    ensure_directories()
    payload = request.get_json(silent=True) or {}
    action = str(payload.get("action", "")).strip().lower()
    device_id = str(payload.get("deviceId", "")).strip()
    track_uri = str(payload.get("trackUri", "")).strip()
    context_uri = str(payload.get("contextUri", "")).strip()
    try:
        position_ms = int(payload.get("positionMs", 0) or 0)
    except (TypeError, ValueError):
        position_ms = 0
    shuffle_enabled = bool(payload.get("shuffle"))
    target_device_id = ""

    log_spotify_playback(
        "command requested",
        action=action,
        requestedDeviceId=device_id,
        trackUri=track_uri,
        contextUri=context_uri,
        positionMs=position_ms,
        shuffle=shuffle_enabled,
    )

    try:
        access_token = get_valid_spotify_access_token()
        if action in {"play", "resume"}:
            target_device_id = ensure_spotify_target_device(access_token, device_id)
            spotify_api_request(access_token, "PUT", "/me/player/play", params={"device_id": target_device_id})
        elif action == "pause":
            target_device_id = ensure_spotify_target_device(access_token, device_id)
            spotify_api_request(access_token, "PUT", "/me/player/pause", params={"device_id": target_device_id})
        elif action == "next":
            target_device_id = ensure_spotify_target_device(access_token, device_id)
            spotify_api_request(access_token, "POST", "/me/player/next", params={"device_id": target_device_id})
        elif action == "previous":
            target_device_id = ensure_spotify_target_device(access_token, device_id)
            spotify_api_request(access_token, "POST", "/me/player/previous", params={"device_id": target_device_id})
        elif action == "seek":
            target_device_id = ensure_spotify_target_device(access_token, device_id)
            spotify_api_request(
                access_token,
                "PUT",
                "/me/player/seek",
                params={
                    "position_ms": max(0, position_ms),
                    "device_id": target_device_id,
                },
            )
        elif action == "play-track":
            if not track_uri:
                return jsonify({"error": "Missing Spotify track URI."}), 400
            target_device_id = ensure_spotify_target_device(access_token, device_id)
            if context_uri:
                spotify_api_request(
                    access_token,
                    "PUT",
                    "/me/player/shuffle",
                    params={"state": "true" if shuffle_enabled else "false", "device_id": target_device_id},
                )
                time.sleep(0.15)
            body: dict[str, object]
            if context_uri:
                body = {"context_uri": context_uri, "offset": {"uri": track_uri}}
            else:
                body = {"uris": [track_uri]}
            if position_ms > 0:
                body["position_ms"] = position_ms
            spotify_api_request(access_token, "PUT", "/me/player/play", params={"device_id": target_device_id}, body=body)
        elif action == "play-context":
            if not context_uri:
                return jsonify({"error": "Missing Spotify context URI."}), 400
            target_device_id = ensure_spotify_target_device(access_token, device_id)
            spotify_api_request(
                access_token,
                "PUT",
                "/me/player/shuffle",
                params={"state": "true" if shuffle_enabled else "false", "device_id": target_device_id},
            )
            time.sleep(0.15)
            body: dict[str, object] = {"context_uri": context_uri}
            if track_uri:
                body["offset"] = {"uri": track_uri}
            spotify_api_request(access_token, "PUT", "/me/player/play", params={"device_id": target_device_id}, body=body)
        else:
            return jsonify({"error": "Unsupported Spotify player command."}), 400
    except RuntimeError as error:
        log_spotify_playback(
            "command failed",
            action=action,
            requestedDeviceId=device_id,
            targetDeviceId=target_device_id,
            trackUri=track_uri,
            contextUri=context_uri,
            error=str(error),
        )
        return jsonify({"error": str(error)}), 400

    try:
        response_payload = fetch_spotify_player_state_payload()
    except RuntimeError as error:
        log_spotify_playback(
            "player state refresh failed after command",
            action=action,
            targetDeviceId=target_device_id,
            error=str(error),
        )
        response_payload = {"ok": True, "connected": True}

    if target_device_id:
        response_payload["requestedDeviceId"] = device_id
        response_payload["targetDeviceId"] = target_device_id
        response_payload["hasActiveDevice"] = bool(response_payload.get("hasActiveDevice")) or True
        response_payload["deviceId"] = str(response_payload.get("deviceId", "")).strip() or target_device_id

    log_spotify_playback(
        "command completed",
        action=action,
        requestedDeviceId=device_id,
        targetDeviceId=target_device_id,
        isPlaying=bool(response_payload.get("isPlaying")),
        hasActiveDevice=bool(response_payload.get("hasActiveDevice")),
    )
    return jsonify(response_payload)


@app.get("/api/sync/status")
def get_sync_status():
    ensure_directories()
    return jsonify(get_sync_payload(force_env=True))


@app.post("/api/sync/start")
def start_sync():
    global SYNC_PROCESS, SYNC_PROCESS_KIND

    ensure_directories()
    env = get_sync_environment(force=True)

    with SYNC_LOCK:
        if SYNC_PROCESS is not None and SYNC_PROCESS.poll() is None:
            set_sync_state(
                "syncing",
                "Syncing...",
                "Please wait...",
                busy=True,
                sticky=True,
            )

        elif not bool(env["deviceDetected"]):
            if bool(env["targetVolumeReady"]) and bool(env["resumeScriptReady"]):
                try:
                    SYNC_PROCESS = launch_ipod_resume_pipeline()
                    SYNC_PROCESS_KIND = "resume"
                    set_sync_state(
                        "syncing",
                        "Resuming converter...",
                        "External SSD pipeline starting",
                        busy=True,
                        sticky=True,
                    )
                except OSError:
                    set_sync_state(
                        "error",
                        "Resume failed",
                        "Please try again",
                        action_label="Resume Converter",
                        can_start=True,
                        sticky=True,
                    )
            else:
                set_sync_state("no_device", "Connect iPod to sync")

        elif not bool(env["bridgeReady"]):
            set_sync_state(
                "error",
                "Sync failed",
                "Please try again",
                action_label="Retry Sync",
                can_start=True,
                sticky=True,
            )

        else:
            try:
                SYNC_PROCESS = launch_ipod_sync_pipeline()
                SYNC_PROCESS_KIND = "sync"
                set_sync_state(
                    "syncing",
                    "Syncing...",
                    "Please wait...",
                    busy=True,
                    sticky=True,
                )
            except OSError:
                set_sync_state(
                    "error",
                    "Sync failed",
                    "Please try again",
                    action_label="Retry Sync",
                    can_start=True,
                    sticky=True,
                )

    return jsonify(get_sync_payload(force_env=True))


@app.get("/exports/cleaned/<path:filename>")
def serve_cleaned_export(filename: str):
    ensure_directories()
    return send_from_directory(EXPORT_DIR, filename, as_attachment=False)


@app.get("/exports/thumbnails/<path:filename>")
def serve_export_thumbnail(filename: str):
    ensure_directories()
    return send_from_directory(THUMBNAIL_DIR, filename, as_attachment=False)


@app.get("/exports/cleaned/<path:filename>/artwork")
def serve_cleaned_export_artwork(filename: str):
    ensure_directories()
    file_path = EXPORT_DIR / filename
    if not file_path.exists():
        return ("", 404)

    artwork = get_embedded_artwork(file_path)
    if not artwork:
        return ("", 404)

    artwork_bytes, mime_type = artwork
    return Response(artwork_bytes, mimetype=mime_type)


if __name__ == "__main__":
    ensure_directories()
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "5001"))
    app.run(host=host, port=port, debug=False)
