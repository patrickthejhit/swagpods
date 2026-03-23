#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/ipod_project_config.sh"

OUTPUT_PATH="$IPOD_STATUS_REPORT"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      OUTPUT_PATH="${2:-$OUTPUT_PATH}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

ipod_ensure_project_dirs
touch "$IPOD_PROGRESS_HISTORY"

bytes_to_gb() {
  awk -v bytes="$1" 'BEGIN { printf "%.2f", bytes / 1000000000 }'
}

gb_to_bytes() {
  awk -v gb="$1" 'BEGIN { printf "%.0f", gb * 1000000000 }'
}

percent_of() {
  awk -v numerator="$1" -v denominator="$2" 'BEGIN { if (denominator <= 0) { printf "0.0"; exit } printf "%.1f", (numerator / denominator) * 100 }'
}

progress_bar() {
  awk -v percent="$1" 'BEGIN {
    width = 24
    filled = int((percent / 100.0) * width + 0.5)
    if (filled < 0) filled = 0
    if (filled > width) filled = width
    printf "["
    for (i = 0; i < filled; i++) printf "#"
    for (i = filled; i < width; i++) printf "."
    printf "]"
  }'
}

dir_bytes() {
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    printf '0'
    return 0
  fi
  find "$dir" -type f -exec stat -f '%z' {} \; | awk '{s+=$1} END {print s+0}'
}

dir_count() {
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    printf '0'
    return 0
  fi
  find "$dir" -type f | wc -l | tr -d ' '
}

log_count() {
  local pattern="$1"
  local file="$2"
  local count
  if [[ ! -f "$file" ]]; then
    printf '0'
    return 0
  fi
  count="$(grep -cE "$pattern" "$file" 2>/dev/null || true)"
  count="$(printf '%s' "$count" | tr -cd '0-9')"
  printf '%s' "${count:-0}"
}

media_count() {
  local dir="$1"
  shift
  if [[ ! -d "$dir" ]]; then
    printf '0'
    return 0
  fi
  find "$dir" -type f \( "$@" \) | wc -l | tr -d ' '
}

screen_state="not running"
if pgrep -f "$IPOD_VIDEO_ROOT" >/dev/null 2>&1; then
  screen_state="running in screen (${IPOD_SCREEN_NAME})"
fi

pause_state="clear"
if [[ -f "$IPOD_PAUSE_FLAG" ]]; then
  pause_state="pause requested"
fi

ssd_state="mounted"
if [[ ! -d "$IPOD_TARGET_VOLUME" ]]; then
  ssd_state="not mounted"
fi

power_state="unknown"
if pmset -g batt 2>/dev/null | grep -q 'AC Power'; then
  power_state="on AC power"
elif pmset -g batt 2>/dev/null | grep -q 'Battery Power'; then
  power_state="on battery"
fi

heavy_apps=""
if ps ax -o command= | grep -q 'Adobe Premiere Pro'; then
  heavy_apps="${heavy_apps}Adobe Premiere Pro 2025, "
fi
if ps ax -o command= | grep -q 'QuickTime Player'; then
  heavy_apps="${heavy_apps}QuickTime Player, "
fi
if ps ax -o command= | grep -q '/Applications/Photos.app'; then
  heavy_apps="${heavy_apps}Photos, "
fi
heavy_apps="${heavy_apps%, }"
if [[ -z "$heavy_apps" ]]; then
  heavy_apps="none detected"
fi

video_bytes="$(dir_bytes "$IPOD_VIDEO_FINISH_DIR")"
video_count="$(media_count "$IPOD_VIDEO_FINISH_DIR" -iname '*.mp4' -o -iname '*.m4v')"
video_done="$(log_count '^\[DONE\]' "$IPOD_VIDEO_LOG")"
video_fail="$(log_count '^\[FAIL\]' "$IPOD_VIDEO_LOG")"

music_bytes="$(dir_bytes "$IPOD_MUSIC_ROOT")"
music_count="$(media_count "$IPOD_MUSIC_ROOT" -iname '*.mp3' -o -iname '*.m4a' -o -iname '*.aac' -o -iname '*.wav' -o -iname '*.flac' -o -iname '*.alac')"

podcast_bytes="$(dir_bytes "$IPOD_PODCAST_STAGE_DIR")"
podcast_count="$(dir_count "$IPOD_PODCAST_STAGE_DIR")"

photo_bytes="$(dir_bytes "$IPOD_PHOTO_STAGE_DIR")"
photo_count="$(dir_count "$IPOD_PHOTO_STAGE_DIR")"

total_bytes=$((video_bytes + music_bytes + podcast_bytes + photo_bytes))
remaining_bytes=$(( $(gb_to_bytes "$IPOD_TOTAL_TARGET_GB") - total_bytes ))
if (( remaining_bytes < 0 )); then
  remaining_bytes=0
fi

total_target_bytes="$(gb_to_bytes "$IPOD_TOTAL_TARGET_GB")"
video_target_bytes="$(gb_to_bytes "$IPOD_VIDEO_TARGET_GB")"
music_target_bytes="$(gb_to_bytes "$IPOD_MUSIC_TARGET_GB")"
podcast_target_bytes="$(gb_to_bytes "$IPOD_PODCAST_TARGET_GB")"
photo_target_bytes="$(gb_to_bytes "$IPOD_PHOTO_TARGET_GB")"
overall_percent="$(percent_of "$total_bytes" "$total_target_bytes")"
video_percent="$(percent_of "$video_bytes" "$video_target_bytes")"
music_percent="$(percent_of "$music_bytes" "$music_target_bytes")"
podcast_percent="$(percent_of "$podcast_bytes" "$podcast_target_bytes")"
photo_percent="$(percent_of "$photo_bytes" "$photo_target_bytes")"
overall_bar="$(progress_bar "$overall_percent")"
video_bar="$(progress_bar "$video_percent")"
music_bar="$(progress_bar "$music_percent")"
podcast_bar="$(progress_bar "$podcast_percent")"
photo_bar="$(progress_bar "$photo_percent")"

current_epoch="$(date '+%s')"
printf '%s\t%s\t%s\t%s\t%s\n' "$current_epoch" "$video_bytes" "$music_bytes" "$podcast_bytes" "$photo_bytes" >> "$IPOD_PROGRESS_HISTORY"
tail -n 720 "$IPOD_PROGRESS_HISTORY" > "${IPOD_PROGRESS_HISTORY}.tmp"
mv "${IPOD_PROGRESS_HISTORY}.tmp" "$IPOD_PROGRESS_HISTORY"

eta_summary="$(python3 - "$IPOD_PROGRESS_HISTORY" "$current_epoch" "$total_bytes" "$total_target_bytes" "$video_bytes" "$video_target_bytes" "$IPOD_VIDEO_LOG" <<'PY'
from __future__ import annotations

import datetime as dt
import re
import sys

history_path, current_epoch, total_bytes, total_target, video_bytes, video_target, video_log = sys.argv[1:]
current_epoch = int(current_epoch)
total_bytes = int(total_bytes)
total_target = int(total_target)
video_bytes = int(video_bytes)
video_target = int(video_target)


def format_eta(seconds_remaining: float) -> str:
    eta_at = dt.datetime.fromtimestamp(current_epoch + int(seconds_remaining))
    hours = seconds_remaining / 3600.0
    if hours >= 48:
        lead = f"~{hours / 24.0:.1f} days"
    elif hours >= 2:
        lead = f"~{hours:.1f} hours"
    else:
        lead = f"~{seconds_remaining / 60.0:.0f} minutes"
    return f"{lead} (around {eta_at.strftime('%B %d, %Y %I:%M %p')})"


def pace_note(sample_seconds: int, mode: str) -> str:
    if sample_seconds < 900:
        minutes = max(int(round(sample_seconds / 60.0)), 1)
        return f"based on the last {minutes} minutes of {'total' if mode == 'total' else 'video'} progress"
    if mode == "total":
        return "based on recent total progress"
    return "based on recent video progress"


def from_history() -> tuple[float | None, str, int]:
    rows: list[tuple[int, int, int]] = []
    try:
        with open(history_path, "r", encoding="utf-8") as fh:
            for line in fh:
                parts = line.rstrip("\n").split("\t")
                if len(parts) != 5:
                    continue
                try:
                    ts = int(parts[0])
                    total = int(parts[1]) + int(parts[2]) + int(parts[3]) + int(parts[4])
                    video = int(parts[1])
                except ValueError:
                    continue
                rows.append((ts, total, video))
    except FileNotFoundError:
        return None, "", 0

    rows = [row for row in rows if row[0] <= current_epoch and current_epoch - row[0] <= 24 * 3600]
    if len(rows) < 2:
        return None, "", 0

    baseline = None
    for ts, total, video in rows:
        if current_epoch - ts < 120:
            continue
        if total < total_bytes or video < video_bytes:
            baseline = (ts, total, video)
            break
    if baseline is None:
        return None, "", 0

    ts, total0, video0 = baseline
    elapsed = current_epoch - ts
    delta_total = total_bytes - total0
    delta_video = video_bytes - video0
    if elapsed < 120:
        return None, "", 0
    if delta_total > 50_000_000:
        return delta_total / elapsed, "total", elapsed
    if delta_video > 50_000_000:
        return delta_video / elapsed, "video", elapsed
    return None, "", 0


def from_video_log() -> tuple[float | None, str, int]:
    pattern = re.compile(r"^\[(?P<stamp>[^]]+)\] Output target=.* current=(?P<gb>[0-9.]+) GB$")
    last_match = None
    try:
        with open(video_log, "r", encoding="utf-8", errors="ignore") as fh:
            for line in fh:
                match = pattern.match(line.strip())
                if match:
                    last_match = match
    except FileNotFoundError:
        return None, "", 0

    if last_match is None:
        return None, "", 0

    stamp = last_match.group("stamp")
    stamp_bits = stamp.split()
    if len(stamp_bits) == 6:
        stamp = " ".join(stamp_bits[:4] + stamp_bits[5:])
    try:
        start_dt = dt.datetime.strptime(stamp, "%a %b %d %H:%M:%S %Y")
        start_epoch = int(start_dt.timestamp())
        baseline_video = int(float(last_match.group("gb")) * 1_000_000_000)
    except Exception:
        return None, "", 0

    elapsed = current_epoch - start_epoch
    delta_video = video_bytes - baseline_video
    if elapsed < 120 or delta_video <= 50_000_000:
        return None, "", 0
    return delta_video / elapsed, "video", elapsed


rate, mode, sample_seconds = from_history()
if rate is None:
    rate, mode, sample_seconds = from_video_log()

if rate is None or rate <= 0:
    print("ETA: learning current pace")
    raise SystemExit(0)

if mode == "total":
    remaining = max(total_target - total_bytes, 0)
    print("ETA: " + format_eta(remaining / rate if remaining > 0 else 0) + " " + pace_note(sample_seconds, mode))
else:
    remaining = max(video_target - video_bytes, 0)
    print("ETA: " + format_eta(remaining / rate if remaining > 0 else 0) + " " + pace_note(sample_seconds, mode))
PY
)"

spotify_summary="not run yet"
if [[ -f "$IPOD_SPOTIFY_REPORT" ]]; then
  spotify_summary="$(python3 - "$IPOD_SPOTIFY_REPORT" <<'PY'
import json
import sys

path = sys.argv[1]
try:
    data = json.load(open(path, "r", encoding="utf-8"))
except Exception:
    print("report present but unreadable")
    raise SystemExit(0)
matched = data.get("matched_count", 0)
unmatched = data.get("unmatched_count", 0)
skipped = data.get("skipped_already_in_playlist_count", 0)
source = data.get("spotify_playlist_title") or "Spotify source"
print(f"{source}: matched={matched} unmatched={unmatched} already_in_playlist={skipped}")
PY
)"
fi

df_line="$(df -g "$IPOD_TARGET_VOLUME" 2>/dev/null | tail -n 1 || true)"
volume_free="unknown"
if [[ -n "$df_line" ]]; then
  volume_free="$(printf '%s' "$df_line" | awk '{print $4 "G free"}')"
fi

performance_tips=()
if [[ "$power_state" != "on AC power" ]]; then
  performance_tips+=("Keep the Mac on power during overnight work.")
fi
if [[ "$heavy_apps" != "none detected" ]]; then
  performance_tips+=("Quit $heavy_apps while the pipeline runs.")
fi
performance_tips+=("Avoid large file copies to or from $IPOD_TARGET_VOLUME during conversion.")
performance_tips+=("Leave the external SSD connected directly instead of through a busy hub when possible.")
performance_tips+=("Use the pause script before unplugging the SSD so ffmpeg can finish the current file cleanly.")

health_tips=(
  "Keep the Mac on a hard, open surface so the vents can breathe."
  "Give the machine a cool-down break during the day if it has been hot for hours overnight."
  "Close Adobe Premiere Pro 2025 and QuickTime Player unless you are actively using them."
  "Avoid force-quitting the converter mid-file; use the pause/resume scripts instead."
  "Keep some free space on both the internal drive and $IPOD_TARGET_VOLUME so swap and temp files do not thrash."
)

{
  printf 'iPod Project Status\n'
  printf 'Generated: %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')"
  printf 'Project root: %s\n' "$IPOD_PROJECT_ROOT"
  printf 'Target volume: %s (%s, %s)\n' "$IPOD_TARGET_VOLUME" "$ssd_state" "$volume_free"
  printf '\n'
  printf 'At A Glance\n'
  printf 'OVERALL COMPLETE: %s%% %s\n' "$overall_percent" "$overall_bar"
  printf 'ETA TO CURRENT TARGET: %s\n' "${eta_summary#ETA: }"
  printf 'CURRENT VIDEO STATE: %s\n' "$screen_state"
  printf '\n'
  printf 'Progress Breakdown\n'
  printf -- '- Total staged so far: %s GB / %s GB (%s%%)\n' \
    "$(bytes_to_gb "$total_bytes")" "$IPOD_TOTAL_TARGET_GB" "$overall_percent"
  printf -- '- Video: %s%% %s | %s GB / %s GB (%s files, done log=%s, failed=%s)\n' \
    "$video_percent" "$video_bar" "$(bytes_to_gb "$video_bytes")" "$IPOD_VIDEO_TARGET_GB" "$video_count" "$video_done" "$video_fail"
  printf -- '- Music: %s%% %s | %s GB / %s GB (%s files)\n' \
    "$music_percent" "$music_bar" "$(bytes_to_gb "$music_bytes")" "$IPOD_MUSIC_TARGET_GB" "$music_count"
  printf -- '- Podcasts: %s%% %s | %s GB / %s GB (%s files)\n' \
    "$podcast_percent" "$podcast_bar" "$(bytes_to_gb "$podcast_bytes")" "$IPOD_PODCAST_TARGET_GB" "$podcast_count"
  printf -- '- Photos: %s%% %s | %s GB / %s GB (%s files)\n' \
    "$photo_percent" "$photo_bar" "$(bytes_to_gb "$photo_bytes")" "$IPOD_PHOTO_TARGET_GB" "$photo_count"
  printf -- '- Estimated total planned footprint: %s GB / %s GB\n' \
    "$(bytes_to_gb "$total_bytes")" "$IPOD_TOTAL_TARGET_GB"
  printf -- '- Remaining headroom: %s GB\n' "$(bytes_to_gb "$remaining_bytes")"
  printf -- '- Spotify: %s\n' "$spotify_summary"
  printf -- '- Pipeline state: %s\n' "$pause_state"
  printf '\n'
  printf 'Optimize On Your End\n'
  for tip in "${performance_tips[@]}"; do
    printf -- '- %s\n' "$tip"
  done
  printf '\n'
  printf 'Mac Health\n'
  printf -- '- Power: %s\n' "$power_state"
  printf -- '- Heavy apps: %s\n' "$heavy_apps"
  for tip in "${health_tips[@]}"; do
    printf -- '- %s\n' "$tip"
  done
  printf '\n'
  printf 'If You Need To Unplug The SSD\n'
  printf -- '- Pause: %s\n' "$SCRIPT_DIR/ipod_pause_pipeline.sh"
  printf -- '- Resume after reconnect: %s\n' "$SCRIPT_DIR/ipod_resume_pipeline.sh"
} | tee "$OUTPUT_PATH"
