#!/usr/bin/env python3
"""
Batch retag MP4/M4V files with Apple TV-style TV metadata inferred from filenames.

Expected filename patterns include examples like:
- Show Name - S02E05 - Episode Title.m4v
- Show.Name.S02E05.Episode.Title.mp4
- Show Name Season 2 Episode 5 Episode Title.m4v
- Show Name - 2x05 - Episode Title.mp4

Writes tags compatible with Apple TV and iPod classic video metadata fields.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys
from dataclasses import dataclass
from typing import Dict, Iterable, Optional


VIDEO_EXTENSIONS = {".m4v", ".mp4", ".mov"}
TVSTIK = [10]  # iTunes media type: TV Show


@dataclass
class ParsedMeta:
    show: str
    season: int
    episode: int
    title: str


def clean_text(value: str) -> str:
    value = value.replace("_", " ").replace(".", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip(" -_\t\n\r")


def split_episode_title(rest: str) -> str:
    rest = re.sub(r"^[\s\-_.:|]+", "", rest)
    rest = re.sub(r"\b(1080p|720p|2160p|x264|x265|h264|h265|webrip|web-dl|bluray|dvdrip|aac|dts)\b", "", rest, flags=re.I)
    # Remove common release-group/site suffixes that leak into titles.
    rest = re.sub(r"\bpahe(?:[._ -]*(?:in|li))?\b", "", rest, flags=re.I)
    rest = clean_text(rest)
    return rest or "Episode"


def parse_filename(filename: str) -> Optional[ParsedMeta]:
    stem = pathlib.Path(filename).stem

    patterns = [
        # Show - S02E05 - Title
        re.compile(r"^(?P<show>.+?)\s*[-_. ]+S(?P<season>\d{1,2})E(?P<episode>\d{1,3})\s*[-_. ]*(?P<title>.*)$", re.I),
        # Show - 2x05 - Title
        re.compile(r"^(?P<show>.+?)\s*[-_. ]+(?P<season>\d{1,2})x(?P<episode>\d{1,3})\s*[-_. ]*(?P<title>.*)$", re.I),
        # Show Season 2 Episode 5 Title
        re.compile(r"^(?P<show>.+?)\s+Season\s+(?P<season>\d{1,2})\s+Episode\s+(?P<episode>\d{1,3})\s*(?P<title>.*)$", re.I),
        # Show S02 E05 Title
        re.compile(r"^(?P<show>.+?)\s+S(?P<season>\d{1,2})\s*E(?P<episode>\d{1,3})\s*(?P<title>.*)$", re.I),
    ]

    for pat in patterns:
        m = pat.match(stem)
        if not m:
            continue
        show = clean_text(m.group("show"))
        season = int(m.group("season"))
        episode = int(m.group("episode"))
        title = split_episode_title(m.group("title"))
        return ParsedMeta(show=show, season=season, episode=episode, title=title)

    # Fallback: find first SxxEyy pattern anywhere and split around it.
    fallback = re.search(r"S(?P<season>\d{1,2})E(?P<episode>\d{1,3})", stem, re.I)
    if fallback:
        season = int(fallback.group("season"))
        episode = int(fallback.group("episode"))
        pre = clean_text(stem[: fallback.start()])
        post = split_episode_title(stem[fallback.end() :])
        if pre:
            return ParsedMeta(show=pre, season=season, episode=episode, title=post)

    return None


def show_key(name: str) -> str:
    # Case/spacing-insensitive key used to merge equivalent show names.
    key = clean_text(name).lower()
    key = key.replace("malcom in the middle", "malcolm in the middle")
    key = re.sub(r"\s+", " ", key)
    return key


def prefer_display_name(name: str) -> tuple:
    cleaned = clean_text(name)
    # Prefer human-readable mixed case, then shorter names.
    return (
        cleaned.isupper(),
        len(cleaned),
        cleaned.lower(),
    )


def canonicalize_shows(parsed_by_file: Dict[pathlib.Path, ParsedMeta]) -> Dict[str, str]:
    counts: Dict[str, Dict[str, int]] = {}
    for meta in parsed_by_file.values():
        key = show_key(meta.show)
        candidate = clean_text(meta.show)
        bucket = counts.setdefault(key, {})
        bucket[candidate] = bucket.get(candidate, 0) + 1

    canonical: Dict[str, str] = {}
    for key, bucket in counts.items():
        # Prefer the most common source name; tie-break toward readable mixed-case forms.
        best = sorted(bucket.items(), key=lambda it: (-it[1],) + prefer_display_name(it[0]))[0][0]
        canonical[key] = clean_text(best)
    return canonical


def iter_videos(root: pathlib.Path, recursive: bool) -> Iterable[pathlib.Path]:
    if recursive:
        iterator = root.rglob("*")
    else:
        iterator = root.iterdir()
    for path in iterator:
        if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS:
            yield path


def set_tags(path: pathlib.Path, meta: ParsedMeta, dry_run: bool = True) -> None:
    if dry_run:
        return

    try:
        from mutagen.mp4 import MP4, MP4Tags
    except Exception as exc:
        raise RuntimeError("Missing dependency 'mutagen'. Install with: pip3 install mutagen") from exc

    mp4 = MP4(path)
    if mp4.tags is None:
        mp4.tags = MP4Tags()

    tags = mp4.tags
    tags["tvsh"] = [meta.show]             # TV Show name
    tags["\xa9nam"] = [meta.title]         # Episode title
    tags["tves"] = [meta.episode]          # Episode number
    tags["tvsn"] = [meta.season]           # Season number
    tags["stik"] = TVSTIK                  # Mark as TV show
    tags["\xa9alb"] = [f"{meta.show}, Season {meta.season}"]

    # Sorting helpers (optional, useful in Apple apps)
    tags["sonm"] = [meta.show]
    tags["soal"] = [f"{meta.show} Season {meta.season:02d}"]

    mp4.save()


def main() -> int:
    parser = argparse.ArgumentParser(description="Batch retag video files for Apple TV/iPod TV metadata")
    parser.add_argument("directory", type=pathlib.Path, help="Folder containing video files")
    parser.add_argument("--recursive", action="store_true", help="Scan subfolders")
    parser.add_argument("--apply", action="store_true", help="Write tags (default is dry-run)")
    parser.add_argument("--limit", type=int, default=0, help="Process only first N matched files (0 = all)")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero if any filename cannot be parsed")
    parser.add_argument(
        "--no-normalize-shows",
        action="store_true",
        help="Disable show-name normalization/merging across case variants",
    )
    args = parser.parse_args()

    root = args.directory.expanduser().resolve()
    if not root.exists() or not root.is_dir():
        print(f"Directory not found: {root}", file=sys.stderr)
        return 2

    dry_run = not args.apply
    files = list(iter_videos(root, recursive=args.recursive))
    if args.limit > 0:
        files = files[: args.limit]

    if not files:
        print("No video files found.")
        return 0

    success = 0
    failed = 0
    parsed_by_file: Dict[pathlib.Path, ParsedMeta] = {}
    unparsed: Dict[pathlib.Path, None] = {}

    mode = "DRY-RUN" if dry_run else "APPLY"
    print(f"Mode: {mode}")
    print(f"Found {len(files)} video files")

    for path in files:
        meta = parse_filename(path.name)
        if not meta:
            unparsed[path] = None
            continue
        parsed_by_file[path] = meta

    canonical_shows: Dict[str, str] = {}
    if not args.no_normalize_shows:
        canonical_shows = canonicalize_shows(parsed_by_file)

    for i, path in enumerate(files, start=1):
        meta = parsed_by_file.get(path)
        if not meta:
            failed += 1
            print(f"[{i}] SKIP (unparsed): {path}")
            continue

        if canonical_shows:
            normalized = canonical_shows.get(show_key(meta.show), meta.show)
            meta = ParsedMeta(show=normalized, season=meta.season, episode=meta.episode, title=meta.title)

        print(
            f"[{i}] {path.name} -> show='{meta.show}', season={meta.season}, episode={meta.episode}, title='{meta.title}'"
        )
        try:
            set_tags(path, meta, dry_run=dry_run)
            success += 1
        except Exception as exc:
            failed += 1
            print(f"[{i}] ERROR writing tags for {path}: {exc}", file=sys.stderr)

    print("\nSummary")
    print(f"Tagged/previewed: {success}")
    print(f"Skipped/failed:   {failed}")

    if args.strict and failed > 0:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
