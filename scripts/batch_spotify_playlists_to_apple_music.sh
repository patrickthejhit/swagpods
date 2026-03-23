#!/usr/bin/env bash
set -uo pipefail

URLS_FILE="${1:-}"
MUSIC_ROOT="${2:-/Volumes/4 tb backup/MUSIC}"
FORCE_RERUN="${FORCE_RERUN:-1}"

if [[ -z "$URLS_FILE" || ! -f "$URLS_FILE" ]]; then
  echo "Usage: $0 <playlist_urls.txt> [music_root]" >&2
  exit 2
fi

SCRIPT="/Users/patrickkelker/Documents/New project/scripts/spotify_to_apple_music.py"
LOG_DIR="/tmp/spotify_batch_logs"
mkdir -p "$LOG_DIR"
SUMMARY="$LOG_DIR/summary.tsv"
touch "$SUMMARY"

i=0
while IFS= read -r url; do
  url="$(echo "$url" | xargs)"
  [[ -z "$url" ]] && continue
  [[ "$url" =~ ^# ]] && continue

  if [[ "$url" != *"open.spotify.com/playlist/"* ]]; then
    echo "Skipping non-playlist URL: $url"
    continue
  fi

  i=$((i + 1))
  pid_part="$(echo "$url" | sed -E 's#.*playlist/([^?]+).*#\1#')"
  report="${LOG_DIR}/report_${pid_part}.json"
  run_log="${LOG_DIR}/run_${pid_part}.log"

  if [[ "$FORCE_RERUN" != "1" && -s "$report" ]]; then
    echo "[$i] Skipping (report exists): $url"
    continue
  fi

  echo "[$i] Processing $url"
  PYTHONUNBUFFERED=1 python3 "$SCRIPT" \
    "$url" \
    --music-root "$MUSIC_ROOT" \
    --download-missing \
    --import-mode both \
    --music-timeout 120 \
    --report "$report" 2>&1 | tee "$run_log"

  rc=${PIPESTATUS[0]}
  if [[ $rc -eq 0 ]]; then
    printf "%s\tOK\t%s\t%s\n" "$(date '+%F %T')" "$pid_part" "$url" >> "$SUMMARY"
  else
    printf "%s\tFAIL(%s)\t%s\t%s\n" "$(date '+%F %T')" "$rc" "$pid_part" "$url" >> "$SUMMARY"
    echo "[$i] Failed (rc=$rc), continuing to next playlist."
  fi

done < "$URLS_FILE"

echo "Batch complete. Reports: $LOG_DIR"
