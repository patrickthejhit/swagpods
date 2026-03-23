from __future__ import annotations

import json
import os
import re
import shlex
import subprocess
import sys
import threading
import time
import uuid
from pathlib import Path
from shutil import copy2

from flask import Flask, Response, jsonify, render_template, request, send_from_directory
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
DEFAULT_IPOD_TARGET_VOLUME = "/Volumes/4 tb backup"
DEFAULT_IPOD_PROJECT_ROOT = f"{DEFAULT_IPOD_TARGET_VOLUME}/codex ipod ready 500gb"

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
SYNC_LOCK = threading.Lock()
SYNC_PROCESS: subprocess.Popen[str] | None = None
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


def ensure_directories() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)


def get_ipod_sync_config() -> dict[str, str]:
    config = {
        "targetVolume": os.environ.get("IPOD_TARGET_VOLUME", DEFAULT_IPOD_TARGET_VOLUME),
        "projectRoot": os.environ.get("IPOD_PROJECT_ROOT", DEFAULT_IPOD_PROJECT_ROOT),
        "pipelineLog": os.environ.get("IPOD_PIPELINE_LOG", str(Path.home() / ".codex" / "ipod-supervisor" / "stage_pipeline.log")),
    }

    if not IPOD_CONFIG_SCRIPT.exists():
        return config

    result = subprocess.run(
        [
            "/bin/bash",
            "-lc",
            (
                f"source {shlex.quote(str(IPOD_CONFIG_SCRIPT))} >/dev/null 2>&1; "
                'printf "targetVolume=%s\\nprojectRoot=%s\\npipelineLog=%s\\n" '
                '"${IPOD_TARGET_VOLUME:-}" "${IPOD_PROJECT_ROOT:-}" "${IPOD_PIPELINE_LOG:-}"'
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
    env = {
        "deviceDetected": device_detected,
        "deviceName": device_name or "iPod",
        "bridgeReady": pipeline_ready and target_volume.exists(),
        "targetVolumeReady": target_volume.exists(),
        "pipelineScriptReady": pipeline_ready,
        "mediaCount": count_syncable_media(),
        "targetVolume": str(target_volume),
        "projectRoot": str(project_root),
        "pipelineLog": str(config["pipelineLog"]),
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


def get_sync_payload(force_env: bool = False) -> dict[str, object]:
    global SYNC_PROCESS

    env = get_sync_environment(force=force_env)
    with SYNC_LOCK:
        if SYNC_PROCESS is not None:
            returncode = SYNC_PROCESS.poll()
            if returncode is None:
                if not bool(env["deviceDetected"]):
                    try:
                        SYNC_PROCESS.terminate()
                    except OSError:
                        pass
                    SYNC_PROCESS = None
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
                SYNC_PROCESS = None
                if returncode == 0:
                    set_sync_state(
                        "success",
                        "Synced",
                        "OK to Disconnect",
                        can_start=False,
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
    return render_template(
        "index.html",
        export_dir=str(EXPORT_DIR),
        upload_dir=str(UPLOAD_DIR),
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


@app.get("/api/sync/status")
def get_sync_status():
    ensure_directories()
    return jsonify(get_sync_payload(force_env=True))


@app.post("/api/sync/start")
def start_sync():
    global SYNC_PROCESS

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
