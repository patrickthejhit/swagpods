#!/usr/bin/env python3
import argparse
import csv
import gzip
import html
import json
import os
import re
import shutil
import subprocess
import urllib.parse
import urllib.request
from datetime import datetime
from difflib import SequenceMatcher
from typing import Dict, List, Optional, Tuple

SRC_ROOT = "/Volumes/4 tb backup"
DEST_ROOT = os.path.join(SRC_ROOT, "codex ipod ready")
FINISH_DIR = os.path.join(DEST_ROOT, "finish files")
MAP_FILE = os.path.join(DEST_ROOT, "source_to_output.tsv")
LOG_FILE = os.path.join(DEST_ROOT, "retag_tv_titles.log")

IMDB_DIR = os.path.join(DEST_ROOT, "imdb_cache")
IMDB_EPISODE_GZ = os.path.join(IMDB_DIR, "title.episode.tsv.gz")
IMDB_BASICS_GZ = os.path.join(IMDB_DIR, "title.basics.tsv.gz")
IMDB_SHOW_CACHE = os.path.join(IMDB_DIR, "show_id_cache.json")

IMDB_EPISODE_URL = "https://datasets.imdbws.com/title.episode.tsv.gz"
IMDB_BASICS_URL = "https://datasets.imdbws.com/title.basics.tsv.gz"

FILENAME_RE = re.compile(
    r"^(?P<show>.+?) - [Ss](?P<season>\d{1,2})[Ee](?P<episode>\d{1,3}) - (?P<title>.+)\.(?P<ext>mp4|m4v)$"
)
EPISODE_ID_RE = re.compile(r"(?i)[Ss](\d{1,2})[Ee](\d{1,3})")

JUNK_RE = re.compile(
    r"(?i)\b("
    r"pahe(?:\.in)?|hollymoviehd|esub|x26[45]|h26[45]|hevc|"
    r"web[ -]?dl|web[ -]?hd|webrip|bluray|brrip|"
    r"ddp?[0-9. ]*|aac[0-9. ]*|ac3|dts|6ch|10bit|8bit|"
    r"yts|yify|nf|amzn|episode\s*[0-9]{1,3}"
    r")\b"
)
TIME_RE = re.compile(r"(?i)\b\d{1,2}[: ]\d{2}(?:[: ]\d{2})?\s*(?:am|pm)\b")
DATE_RE = re.compile(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b")
THREE_NUM_TIME_RE = re.compile(r"(?i)\b\d{1,2}\s+\d{1,2}\s+\d{2}\s*(?:am|pm)\b")


def now_ts() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S %Z")


def log(msg: str) -> None:
    line = f"[{now_ts()}] {msg}"
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")
    print(line)


def normalize_name(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def sanitize_component(s: str) -> str:
    out = html.unescape(s)
    out = re.sub(r"[/:*?\"<>|]", " ", out)
    out = re.sub(r"\s+", " ", out).strip()
    out = out.rstrip(". ")
    if not out:
        out = "Unknown"
    return out[:190].rstrip()


def clean_fallback_title(title: str, episode_num: int) -> str:
    t = html.unescape(title or "")
    t = JUNK_RE.sub(" ", t)
    t = TIME_RE.sub(" ", t)
    t = THREE_NUM_TIME_RE.sub(" ", t)
    t = DATE_RE.sub(" ", t)
    t = re.sub(r"(?i)\bcopy\b", " ", t)
    t = re.sub(r"(?i)\btmp[- ]?temp[- ]?\d+\b", " ", t)
    t = re.sub(r"\s+", " ", t).strip(" ._-")
    if not t:
        t = f"Episode {episode_num:02d}"
    return t


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def download_if_needed(url: str, dest: str, refresh: bool = False, max_age_hours: int = 168) -> None:
    if not refresh and os.path.exists(dest):
        age_hours = (datetime.now().timestamp() - os.path.getmtime(dest)) / 3600.0
        if age_hours <= max_age_hours:
            return

    tmp = dest + ".tmp"
    req = urllib.request.Request(url, headers={"User-Agent": "ipod-autoconvert/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r, open(tmp, "wb") as f:
        shutil.copyfileobj(r, f)
    os.replace(tmp, dest)


def load_show_cache() -> Dict[str, Dict[str, str]]:
    if not os.path.exists(IMDB_SHOW_CACHE):
        return {}
    try:
        with open(IMDB_SHOW_CACHE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return {}


def save_show_cache(cache: Dict[str, Dict[str, str]]) -> None:
    tmp = IMDB_SHOW_CACHE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False, sort_keys=True)
    os.replace(tmp, IMDB_SHOW_CACHE)


def imdb_suggest(query: str) -> List[Dict[str, str]]:
    q = query.strip()
    if not q:
        return []
    first = q[0].lower()
    if not first.isalnum():
        first = "a"
    url = f"https://v3.sg.media-imdb.com/suggestion/{first}/{urllib.parse.quote(q)}.json"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as r:
        data = json.loads(r.read().decode("utf-8", errors="replace"))
    rows = []
    for item in data.get("d", []):
        qid = item.get("qid", "")
        if qid not in ("tvSeries", "tvMiniSeries"):
            continue
        tid = item.get("id", "")
        title = item.get("l", "")
        if not tid or not title:
            continue
        rows.append({"id": tid, "title": title})
    return rows


def pick_best_show(query: str, candidates: List[Dict[str, str]]) -> Optional[Dict[str, str]]:
    qn = normalize_name(query)
    best = None
    best_score = -1.0
    for cand in candidates:
        cn = normalize_name(cand["title"])
        score = SequenceMatcher(None, qn, cn).ratio()
        if qn == cn:
            score += 1.5
        elif qn in cn or cn in qn:
            score += 0.3
        if score > best_score:
            best_score = score
            best = cand
    return best


def resolve_show_to_imdb(show: str, cache: Dict[str, Dict[str, str]]) -> Optional[Dict[str, str]]:
    key = normalize_name(show)
    if key in cache:
        row = cache[key]
        if row.get("id") and row.get("title"):
            return row
        return None

    try:
        candidates = imdb_suggest(show)
    except Exception:
        cache[key] = {"id": "", "title": ""}
        return None

    best = pick_best_show(show, candidates) if candidates else None
    if not best:
        cache[key] = {"id": "", "title": ""}
        return None

    cache[key] = {"id": best["id"], "title": best["title"]}
    return cache[key]


def load_map_lines() -> List[List[str]]:
    rows: List[List[str]] = []
    if not os.path.exists(MAP_FILE):
        return rows
    with open(MAP_FILE, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.rstrip("\n")
            if "\t" not in line:
                continue
            a, b = line.split("\t", 1)
            rows.append([a.strip(), b.strip()])
    return rows


def rewrite_map_lines(rows: List[List[str]]) -> None:
    tmp = MAP_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        for a, b in rows:
            f.write(f"{a}\t{b}\n")
    os.replace(tmp, MAP_FILE)


def replace_output_name_in_map(rows: List[List[str]], old_name: str, new_name: str) -> int:
    changed = 0
    for row in rows:
        if row[1] == old_name:
            row[1] = new_name
            changed += 1
    return changed


def ffprobe_tags(path: str) -> Dict[str, str]:
    tags: Dict[str, str] = {}
    try:
        out = subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format_tags=title,show,episode_id,season_number,episode_sort",
                "-of",
                "default=noprint_wrappers=1:nokey=0",
                path,
            ],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        return tags
    for line in out.splitlines():
        if line.startswith("TAG:") and "=" in line:
            k, v = line[4:].split("=", 1)
            tags[k.strip()] = v.strip()
    return tags


def parse_tv_identity(filename: str, tags: Dict[str, str]) -> Optional[Tuple[str, int, int, str, str]]:
    m = FILENAME_RE.match(filename)
    if m:
        return (
            m.group("show").strip(),
            int(m.group("season")),
            int(m.group("episode")),
            m.group("title").strip(),
            "." + m.group("ext").lower(),
        )

    show = tags.get("show", "").strip()
    ep_id = tags.get("episode_id", "").strip()
    title = tags.get("title", "").strip()
    ext = os.path.splitext(filename)[1].lower() or ".mp4"
    mm = EPISODE_ID_RE.search(ep_id)
    if show and mm:
        return (show, int(mm.group(1)), int(mm.group(2)), title, ext)
    return None


def retag_file(path: str, show: str, season: int, episode: int, title: str, dry_run: bool) -> bool:
    if dry_run:
        return True
    ep_code = f"S{season:02d}E{episode:02d}"
    cmd = [
        "AtomicParsley",
        path,
        "--stik",
        "TV Show",
        "--TVShowName",
        show,
        "--title",
        title,
        "--TVEpisode",
        ep_code,
        "--TVSeasonNum",
        str(season),
        "--TVEpisodeNum",
        str(episode),
        "--album",
        f"{show}, Season {season}",
        "--artist",
        show,
        "--overWrite",
    ]
    rc = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode
    return rc == 0


def unique_path(path: str) -> str:
    if not os.path.exists(path):
        return path
    stem, ext = os.path.splitext(path)
    i = 2
    while True:
        cand = f"{stem} ({i}){ext}"
        if not os.path.exists(cand):
            return cand
        i += 1


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Retag and rename TV files from IMDb episode data.")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--refresh-imdb", action="store_true")
    p.add_argument(
        "--show",
        action="append",
        default=[],
        help="Only process matching show name (repeatable).",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()
    dry_run = args.dry_run

    if not os.path.isdir(FINISH_DIR):
        print(f"Missing folder: {FINISH_DIR}")
        return 2

    ensure_dir(IMDB_DIR)
    download_if_needed(IMDB_EPISODE_URL, IMDB_EPISODE_GZ, refresh=args.refresh_imdb)
    download_if_needed(IMDB_BASICS_URL, IMDB_BASICS_GZ, refresh=args.refresh_imdb)

    show_filter = {normalize_name(s) for s in args.show if s.strip()}

    rows = load_map_lines()
    map_dirty = False

    files = sorted(
        f
        for f in os.listdir(FINISH_DIR)
        if f.lower().endswith(".mp4") or f.lower().endswith(".m4v")
    )

    items = []
    for fname in files:
        path = os.path.join(FINISH_DIR, fname)
        tags = ffprobe_tags(path)
        ident = parse_tv_identity(fname, tags)
        if not ident:
            continue
        show, season, episode, cur_title, ext = ident
        if show_filter and normalize_name(show) not in show_filter:
            continue
        items.append(
            {
                "fname": fname,
                "path": path,
                "show": show,
                "season": season,
                "episode": episode,
                "title": cur_title,
                "ext": ext,
            }
        )

    if not items:
        log("No matching TV items found for IMDb pass.")
        return 0

    cache = load_show_cache()
    show_norm_to_imdb: Dict[str, Dict[str, str]] = {}
    for show_norm, show_raw in sorted({(normalize_name(i["show"]), i["show"]) for i in items}):
        resolved = resolve_show_to_imdb(show_raw, cache)
        if resolved:
            show_norm_to_imdb[show_norm] = resolved
        else:
            log(f"[WARN][IMDB] Could not resolve show '{show_raw}'")
    save_show_cache(cache)

    parent_needed = {v["id"] for v in show_norm_to_imdb.values()}
    if not parent_needed:
        log("No shows resolved to IMDb IDs; nothing to do.")
        return 1

    keys_needed = set()
    for i in items:
        sn = normalize_name(i["show"])
        if sn in show_norm_to_imdb:
            parent = show_norm_to_imdb[sn]["id"]
            keys_needed.add((parent, i["season"], i["episode"]))

    episode_tconst: Dict[Tuple[str, int, int], str] = {}
    with gzip.open(IMDB_EPISODE_GZ, "rt", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            parent = row.get("parentTconst", "")
            if parent not in parent_needed:
                continue
            s = row.get("seasonNumber", "\\N")
            e = row.get("episodeNumber", "\\N")
            if s == "\\N" or e == "\\N":
                continue
            try:
                key = (parent, int(s), int(e))
            except ValueError:
                continue
            if key in keys_needed:
                episode_tconst[key] = row.get("tconst", "")

    need_titles = {v for v in episode_tconst.values() if v}
    title_by_tconst: Dict[str, str] = {}
    if need_titles:
        with gzip.open(IMDB_BASICS_GZ, "rt", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f, delimiter="\t")
            for row in reader:
                tconst = row.get("tconst", "")
                if tconst in need_titles:
                    title_by_tconst[tconst] = row.get("primaryTitle", "").strip()
                    if len(title_by_tconst) == len(need_titles):
                        break

    stats = {
        "seen": len(items),
        "retagged": 0,
        "renamed": 0,
        "imdb_hits": 0,
        "imdb_miss": 0,
        "failed": 0,
        "map_updates": 0,
    }
    log("Starting IMDb-backed retag + rename pass")
    if dry_run:
        log("Running in dry-run mode")

    for item in items:
        old_name = item["fname"]
        old_path = item["path"]
        season = item["season"]
        episode = item["episode"]
        ext = item["ext"]

        show_norm = normalize_name(item["show"])
        imdb = show_norm_to_imdb.get(show_norm)
        if not imdb:
            stats["imdb_miss"] += 1
            continue

        parent = imdb["id"]
        imdb_show_title = imdb["title"].strip() or item["show"]
        ep_tconst = episode_tconst.get((parent, season, episode), "")
        imdb_ep_title = title_by_tconst.get(ep_tconst, "").strip() if ep_tconst else ""

        if imdb_ep_title:
            final_title = imdb_ep_title
            stats["imdb_hits"] += 1
        else:
            final_title = clean_fallback_title(item["title"], episode)
            stats["imdb_miss"] += 1

        final_show = imdb_show_title
        final_show = sanitize_component(final_show)
        final_title = sanitize_component(final_title)

        ok = retag_file(
            old_path,
            final_show,
            season,
            episode,
            final_title,
            dry_run=dry_run,
        )
        if not ok:
            stats["failed"] += 1
            log(f"[FAIL][TAG] {old_name}")
            continue
        stats["retagged"] += 1

        new_base = f"{final_show} - S{season:02d}E{episode:02d} - {final_title}{ext}"
        if new_base == old_name:
            continue

        target = unique_path(os.path.join(FINISH_DIR, new_base))
        new_name = os.path.basename(target)
        if dry_run:
            log(f"[DRYRUN][RENAME] {old_name} -> {new_name}")
        else:
            os.replace(old_path, target)
            stats["renamed"] += 1
            log(f"[RENAME] {old_name} -> {new_name}")
            updates = replace_output_name_in_map(rows, old_name, new_name)
            if updates:
                map_dirty = True
                stats["map_updates"] += updates

    if map_dirty and not dry_run:
        rewrite_map_lines(rows)

    log(
        "Finished IMDb-backed retag + rename pass "
        f"(seen={stats['seen']}, retagged={stats['retagged']}, renamed={stats['renamed']}, "
        f"imdb_hits={stats['imdb_hits']}, imdb_miss={stats['imdb_miss']}, "
        f"failed={stats['failed']}, map_updates={stats['map_updates']})"
    )
    return 0 if stats["failed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
