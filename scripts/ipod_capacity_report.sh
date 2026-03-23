#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

SRC_ROOT="/Volumes/4 tb backup"
DEST_ROOT="$SRC_ROOT/codex ipod ready"
FINISH_DIR="$DEST_ROOT/finish files"
CACHE_FILE="$DEST_ROOT/source_duration_cache.tsv"
TARGET_GB=400
AUDIO_BITRATE_K=96
LIMIT=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dest-root)
      DEST_ROOT="${2:-$DEST_ROOT}"
      FINISH_DIR="$DEST_ROOT/finish files"
      CACHE_FILE="$DEST_ROOT/source_duration_cache.tsv"
      shift 2
      ;;
    --target-gb)
      TARGET_GB="${2:-400}"
      shift 2
      ;;
    --audio-bitrate)
      AUDIO_BITRATE_K="${2:-96}"
      shift 2
      ;;
    --limit)
      LIMIT="${2:-0}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

mkdir -p "$DEST_ROOT"
touch "$CACHE_FILE"

cache_lookup() {
  local path="$1"
  local mtime="$2"
  awk -F '\t' -v p="$path" -v m="$mtime" '$1 == p && $2 == m {print $3; exit}' "$CACHE_FILE"
}

cache_store() {
  local path="$1"
  local mtime="$2"
  local duration="$3"
  printf '%s\t%s\t%s\n' "$path" "$mtime" "$duration" >> "$CACHE_FILE"
}

probe_duration() {
  local path="$1"
  ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$path" 2>/dev/null | head -n 1
}

human_hours() {
  awk -v seconds="$1" 'BEGIN { printf "%.2f", seconds / 3600 }'
}

to_gb() {
  awk -v bytes="$1" 'BEGIN { printf "%.2f", bytes / 1000000000 }'
}

to_kbps() {
  awk -v bytes="$1" -v seconds="$2" 'BEGIN { if (seconds <= 0) { print 0; exit } printf "%.0f", (bytes * 8) / seconds / 1000 }'
}

total_seconds=0
file_count=0
source_bytes=0

while IFS= read -r -d '' file; do
  mtime="$(stat -f '%m' "$file")"
  size_bytes="$(stat -f '%z' "$file")"
  duration="$(cache_lookup "$file" "$mtime" || true)"
  if [[ -z "$duration" ]]; then
    duration="$(probe_duration "$file" || true)"
    duration="$(printf '%s' "$duration" | tr -d '\r')"
    if [[ -z "$duration" ]]; then
      duration="0"
    fi
    cache_store "$file" "$mtime" "$duration"
  fi

  total_seconds="$(awk -v a="$total_seconds" -v b="$duration" 'BEGIN { printf "%.3f", a + b }')"
  source_bytes=$((source_bytes + size_bytes))
  file_count=$((file_count + 1))

  if [[ "$LIMIT" -gt 0 && "$file_count" -ge "$LIMIT" ]]; then
    break
  fi
done < <(
  find "$SRC_ROOT" \
    \( -path "$DEST_ROOT" -o -path "$DEST_ROOT/*" -o -path "$SRC_ROOT/.Spotlight-V100" -o -path "$SRC_ROOT/.Trashes" -o -path "$SRC_ROOT/.DocumentRevisions-V100" -o -path "$SRC_ROOT/.TemporaryItems" \) -prune -o \
    -type f \( -iname "*.mp4" -o -iname "*.m4v" -o -iname "*.mov" -o -iname "*.avi" -o -iname "*.mkv" -o -iname "*.wmv" -o -iname "*.flv" -o -iname "*.webm" -o -iname "*.mpg" -o -iname "*.mpeg" -o -iname "*.3gp" -o -iname "*.mts" -o -iname "*.m2ts" \) \
    -print0
)

finish_bytes=0
finish_count=0
if [[ -d "$FINISH_DIR" ]]; then
  finish_bytes="$(find "$FINISH_DIR" -type f \( -iname "*.mp4" -o -iname "*.m4v" \) -exec stat -f '%z' {} \; | awk '{s+=$1} END {print s+0}')"
  finish_count="$(find "$FINISH_DIR" -type f \( -iname "*.mp4" -o -iname "*.m4v" \) | wc -l | tr -d ' ')"
fi

target_bytes="$(awk -v gb="$TARGET_GB" 'BEGIN { printf "%.0f", gb * 1000000000 }')"
target_total_kbps="$(to_kbps "$target_bytes" "$total_seconds")"
recommended_video_kbps=$((target_total_kbps - AUDIO_BITRATE_K))
if [[ "$recommended_video_kbps" -lt 200 ]]; then
  recommended_video_kbps=200
fi

cat <<EOF
Target size: ${TARGET_GB} GB
Source files scanned: ${file_count}
Total source duration: $(human_hours "$total_seconds") hours
Current source size: $(to_gb "$source_bytes") GB
Current finished iPod files: ${finish_count} files, $(to_gb "$finish_bytes") GB

To fit the full library into ${TARGET_GB} GB:
- Average total bitrate budget: ${target_total_kbps} kbps
- If audio stays at ${AUDIO_BITRATE_K} kbps AAC, target video bitrate is about ${recommended_video_kbps} kbps

Suggested presets:
- Similar quality / safer: --quality balanced
- Better chance to fit: --quality compact
- Most aggressive preset here: --quality very-compact
EOF
