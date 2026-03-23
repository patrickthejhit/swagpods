#!/usr/bin/env python3
from __future__ import annotations

import argparse
import email.utils
import html
import pathlib
import re
import ssl
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


FEED_URL = "https://feeds.megaphone.fm/GLT1158789509"
USER_AGENT = "mssp-ipod-stage/1.0"


def sanitize(value: str) -> str:
    text = html.unescape(value).strip()
    text = re.sub(r"[\\/:*?\"<>|]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:180] or "episode"


def fetch_feed(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=60, context=ctx) as resp:
        return resp.read()


def iter_items(feed_bytes: bytes):
    root = ET.fromstring(feed_bytes)
    channel = root.find("channel")
    if channel is None:
        return []
    return channel.findall("item")


def enclosure_url(item: ET.Element) -> str:
    enclosure = item.find("enclosure")
    if enclosure is None:
        return ""
    return (enclosure.attrib.get("url") or "").strip()


def item_guid(item: ET.Element) -> str:
    return (item.findtext("guid", default="") or "").strip() or enclosure_url(item)


def iso_pub_date(value: str) -> str:
    parsed = email.utils.parsedate_to_datetime(value)
    if parsed is None:
        return sanitize(value)
    return parsed.strftime("%Y-%m-%d")


def extension_for_url(url: str) -> str:
    path = urllib.parse.urlparse(url).path
    suffix = pathlib.Path(path).suffix.lower()
    if suffix in {".mp3", ".m4a", ".aac", ".mp4"}:
        return suffix
    return ".mp3"


def load_existing_manifest(path: pathlib.Path) -> set[str]:
    existing: set[str] = set()
    if not path.exists():
        return existing
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        if parts:
            existing.add(parts[0])
    return existing


def download_file(url: str, dest: pathlib.Path) -> None:
    tmp = dest.with_suffix(dest.suffix + ".download")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=300, context=ctx) as resp, tmp.open("wb") as fh:
        while True:
            chunk = resp.read(1024 * 256)
            if not chunk:
                break
            fh.write(chunk)
    tmp.replace(dest)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dest-dir", required=True)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    dest_dir = pathlib.Path(args.dest_dir).expanduser()
    manifest = pathlib.Path(args.manifest).expanduser()
    dest_dir.mkdir(parents=True, exist_ok=True)
    manifest.parent.mkdir(parents=True, exist_ok=True)
    manifest.touch(exist_ok=True)

    existing = load_existing_manifest(manifest)
    feed = fetch_feed(FEED_URL)
    items = iter_items(feed)
    if args.limit > 0:
        items = items[:args.limit]

    downloaded = 0
    skipped = 0
    for item in items:
        url = enclosure_url(item)
        guid = item_guid(item)
        title = sanitize(item.findtext("title", default="episode"))
        pub_date_raw = item.findtext("pubDate", default="unknown date")
        pub_date = iso_pub_date(pub_date_raw)
        if not url or not guid:
            continue
        if guid in existing:
            skipped += 1
            continue
        ext = extension_for_url(url)
        dest = dest_dir / f"MSSP - {pub_date} - {title}{ext}"
        if dest.exists():
            skipped += 1
            existing.add(guid)
            with manifest.open("a", encoding="utf-8") as fh:
                fh.write(f"{guid}\t{url}\t{pub_date}\t{dest.name}\t{title}\n")
            continue
        print(f"DOWNLOAD {dest.name}")
        download_file(url, dest)
        existing.add(guid)
        with manifest.open("a", encoding="utf-8") as fh:
            fh.write(f"{guid}\t{url}\t{pub_date}\t{dest.name}\t{title}\n")
        downloaded += 1

    print(f"DONE downloaded={downloaded} skipped={skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
