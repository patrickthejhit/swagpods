#!/usr/bin/env bash
set -u

SRC="/Volumes/4 tb backup"
DEST="$SRC/codex ipod ready"
CONV_LOG="$DEST/conversion_and_tagging.log"
OUT_LOG="/Users/patrickkelker/Documents/New project/ipod_progress_10min.log"

mkdir -p "$(dirname "$OUT_LOG")"
touch "$OUT_LOG"

snapshot() {
  local total done_count fail_count pct w f bar empty
  total=$(find "$SRC" \
    \( -path "$DEST" -o -path "$DEST/*" -o -path "$SRC/.Spotlight-V100" -o -path "$SRC/.Trashes" -o -path "$SRC/.DocumentRevisions-V100" -o -path "$SRC/.TemporaryItems" \) -prune -o \
    -type f \( -iname "*.mp4" -o -iname "*.m4v" -o -iname "*.mov" -o -iname "*.avi" -o -iname "*.mkv" -o -iname "*.wmv" -o -iname "*.flv" -o -iname "*.webm" -o -iname "*.mpg" -o -iname "*.mpeg" -o -iname "*.3gp" -o -iname "*.mts" -o -iname "*.m2ts" \) -print | wc -l | tr -d ' ')
  done_count=$(rg -c '^\[DONE\]' "$CONV_LOG" 2>/dev/null || echo 0)
  fail_count=$(rg -c '^\[FAIL\]' "$CONV_LOG" 2>/dev/null || echo 0)
  pct=0
  if [[ "$total" -gt 0 ]]; then
    pct=$(( done_count * 100 / total ))
  fi

  w=30
  f=$(( pct * w / 100 ))
  bar=$(printf '%*s' "$f" '' | tr ' ' '#')
  empty=$(printf '%*s' $((w-f)) '' | tr ' ' '-')

  printf '[%s] [%s%s] %s%% done=%s/%s failed=%s\n' \
    "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$bar" "$empty" "$pct" "$done_count" "$total" "$fail_count" >> "$OUT_LOG"
}

echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] monitor started (interval=10m)" >> "$OUT_LOG"
while true; do
  snapshot
  sleep 600
done
