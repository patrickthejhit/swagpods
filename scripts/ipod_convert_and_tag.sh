#!/usr/bin/env bash
set -uo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

SRC_ROOT="/Volumes/4 tb backup"
DEST_ROOT="$SRC_ROOT/codex ipod ready"
FINISH_DIR=""
LOG=""
MAP_FILE=""
TV_IMPORT_LOG=""
TV_IMPORTED_MAP=""
TVMAZE_CACHE=""
TVMAZE_TITLE_CACHE=""
FAILED_INPUTS_MAP=""
LOCK_DIR=""
SINGLE_INPUT=""
LIMIT=0
TV_ONLY=0
FAST_MODE=0
FAST_ENCODER=""
QUALITY_PRESET="compact"
VIDEO_BITRATE_K=768
AUDIO_BITRATE_K=96
MAXRATE_K=900
BUFSIZE_K=1800
STOP_BATCH=0
TV_APP_SKIP=0
TARGET_GB=0
TARGET_BYTES=0
CURRENT_OUTPUT_BYTES=0
PAUSE_FLAG=""
PRIORITY_SHOW_PATTERNS=(
  "sopranos"
  "breaking bad"
  "the office"
  "succession"
  "white lotus"
  "severance"
  "plurbuis"
  "plurbus"
  "pluribus"
)

apply_quality_preset() {
  case "$1" in
    legacy)
      QUALITY_PRESET="legacy"
      VIDEO_BITRATE_K=1500
      AUDIO_BITRATE_K=160
      MAXRATE_K=2500
      BUFSIZE_K=4096
      ;;
    balanced)
      QUALITY_PRESET="balanced"
      VIDEO_BITRATE_K=1000
      AUDIO_BITRATE_K=128
      MAXRATE_K=1200
      BUFSIZE_K=2400
      ;;
    compact)
      QUALITY_PRESET="compact"
      VIDEO_BITRATE_K=768
      AUDIO_BITRATE_K=96
      MAXRATE_K=900
      BUFSIZE_K=1800
      ;;
    very-compact)
      QUALITY_PRESET="very-compact"
      VIDEO_BITRATE_K=640
      AUDIO_BITRATE_K=96
      MAXRATE_K=768
      BUFSIZE_K=1536
      ;;
    *)
      echo "Unknown quality preset: $1" >&2
      exit 2
      ;;
  esac
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dest-root)
      DEST_ROOT="${2:-}"
      shift 2
      ;;
    --single)
      SINGLE_INPUT="${2:-}"
      shift 2
      ;;
    --limit)
      LIMIT="${2:-0}"
      shift 2
      ;;
    --tv-only)
      TV_ONLY=1
      shift
      ;;
    --skip-tv-app)
      TV_APP_SKIP=1
      shift
      ;;
    --fast)
      FAST_MODE=1
      shift
      ;;
    --target-gb)
      TARGET_GB="${2:-0}"
      shift 2
      ;;
    --quality)
      apply_quality_preset "${2:-}"
      shift 2
      ;;
    --pause-flag)
      PAUSE_FLAG="${2:-}"
      shift 2
      ;;
    --video-bitrate)
      VIDEO_BITRATE_K="${2:-}"
      shift 2
      ;;
    --audio-bitrate)
      AUDIO_BITRATE_K="${2:-}"
      shift 2
      ;;
    --maxrate)
      MAXRATE_K="${2:-}"
      shift 2
      ;;
    --bufsize)
      BUFSIZE_K="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

update_paths() {
  FINISH_DIR="$DEST_ROOT/finish files"
  LOG="$DEST_ROOT/conversion_and_tagging.log"
  MAP_FILE="$DEST_ROOT/source_to_output.tsv"
  TV_IMPORT_LOG="$DEST_ROOT/apple_tv_import.log"
  TV_IMPORTED_MAP="$DEST_ROOT/apple_tv_imported.tsv"
  TVMAZE_CACHE="$DEST_ROOT/tvmaze_cache.tsv"
  TVMAZE_TITLE_CACHE="$DEST_ROOT/tvmaze_title_lookup.tsv"
  FAILED_INPUTS_MAP="$DEST_ROOT/failed_inputs.tsv"
  LOCK_DIR="$DEST_ROOT/.converter_lock"
}

update_paths

mkdir -p "$DEST_ROOT" "$FINISH_DIR"
touch "$MAP_FILE"
touch "$TV_IMPORT_LOG" "$TV_IMPORTED_MAP"
touch "$TVMAZE_CACHE"
touch "$TVMAZE_TITLE_CACHE"
touch "$FAILED_INPUTS_MAP"
touch "$LOG"

if [[ "$FAST_MODE" -eq 1 ]]; then
  if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q '\bh264_videotoolbox\b'; then
    FAST_ENCODER="h264_videotoolbox"
    echo "[$(date)] Fast mode enabled with hardware encoder: $FAST_ENCODER" >> "$LOG"
  elif ffmpeg -hide_banner -encoders 2>/dev/null | grep -q '\blibx264\b'; then
    FAST_ENCODER="libx264"
    echo "[$(date)] Fast mode enabled with software encoder fallback: $FAST_ENCODER" >> "$LOG"
  else
    echo "[$(date)] Fast mode requested but no H.264 encoder found; using default MPEG-4 encoder." >> "$LOG"
  fi
fi

acquire_lock() {
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    printf '%s\n' "$$" > "$LOCK_DIR/pid"
    return 0
  fi

  if [[ -f "$LOCK_DIR/pid" ]]; then
    local prior_pid
    prior_pid="$(cat "$LOCK_DIR/pid" 2>/dev/null || true)"
    if [[ -n "$prior_pid" ]] && kill -0 "$prior_pid" 2>/dev/null; then
      echo "[$(date)] Another converter is already running (pid $prior_pid). Exiting." >> "$LOG"
      exit 0
    fi
  fi

  rm -rf "$LOCK_DIR" 2>/dev/null || true
  mkdir "$LOCK_DIR"
  printf '%s\n' "$$" > "$LOCK_DIR/pid"
}

release_lock() {
  rm -rf "$LOCK_DIR" 2>/dev/null || true
}

safe_log() {
  { printf '%s\n' "$1" >> "$LOG"; } 2>/dev/null || true
}

bytes_to_gb() {
  awk -v bytes="$1" 'BEGIN { printf "%.2f", bytes / 1000000000 }'
}

gb_to_bytes() {
  awk -v gb="$1" 'BEGIN { printf "%.0f", gb * 1000000000 }'
}

directory_media_bytes() {
  local dir="$1"

  if [[ ! -d "$dir" ]]; then
    printf '0'
    return 0
  fi

  find "$dir" -type f \( -iname "*.mp4" -o -iname "*.m4v" \) -exec stat -f '%z' {} \; | awk '{s+=$1} END {print s+0}'
}

initialize_output_budget() {
  if [[ -z "$TARGET_GB" || "$TARGET_GB" == "0" ]]; then
    TARGET_BYTES=0
    CURRENT_OUTPUT_BYTES=0
    return 0
  fi

  TARGET_BYTES="$(gb_to_bytes "$TARGET_GB")"
  CURRENT_OUTPUT_BYTES="$(directory_media_bytes "$FINISH_DIR")"
  safe_log "[$(date)] Output target=${TARGET_GB} GB current=$(bytes_to_gb "$CURRENT_OUTPUT_BYTES") GB"
}

stop_batch_due_to_target() {
  local reason="$1"

  if [[ "$STOP_BATCH" -eq 0 ]]; then
    STOP_BATCH=1
    safe_log "[STOP][TARGET] $reason"
  fi

  return 1
}

ensure_output_budget_available() {
  if [[ "$TARGET_BYTES" -le 0 ]]; then
    return 0
  fi

  if (( CURRENT_OUTPUT_BYTES >= TARGET_BYTES )); then
    stop_batch_due_to_target "Current output already at $(bytes_to_gb "$CURRENT_OUTPUT_BYTES") GB, target is ${TARGET_GB} GB."
    return 1
  fi

  return 0
}

lookup_failed_input() {
  local rel="$1"
  local mtime="$2"
  awk -F '\t' -v key="$rel" -v m="$mtime" '$1 == key && $2 == m {print $3; exit}' "$FAILED_INPUTS_MAP"
}

record_failed_input() {
  local rel="$1"
  local mtime="$2"
  local reason="$3"

  if [[ -z "$(lookup_failed_input "$rel" "$mtime")" ]]; then
    printf '%s\t%s\t%s\n' "$rel" "$mtime" "$reason" >> "$FAILED_INPUTS_MAP"
  fi
}

source_volume_available() {
  if [[ ! -d "$SRC_ROOT" ]]; then
    return 1
  fi

  if [[ -d "$SRC_ROOT/MUSIC" || -d "$SRC_ROOT/GOOD IPOD BACKUP" || -d "$DEST_ROOT" ]]; then
    return 0
  fi

  return 1
}

stop_batch_if_source_missing() {
  if source_volume_available; then
    return 0
  fi

  if [[ "$STOP_BATCH" -eq 0 ]]; then
    STOP_BATCH=1
    safe_log "[$(date)] Source volume unavailable; stopping batch."
    printf '[%s] Source volume unavailable; stopping batch.\n' "$(date)" >&2
  fi

  return 1
}

stop_batch_if_pause_requested() {
  if [[ -z "$PAUSE_FLAG" || ! -f "$PAUSE_FLAG" ]]; then
    return 0
  fi

  if [[ "$STOP_BATCH" -eq 0 ]]; then
    STOP_BATCH=1
    safe_log "[$(date)] Pause requested via $PAUSE_FLAG; stopping after the current file boundary."
    printf '[%s] Pause requested; stopping after the current file boundary.\n' "$(date)" >&2
  fi

  return 1
}

disable_tv_app_imports() {
  local reason="$1"

  if [[ "$TV_APP_SKIP" -ne 0 ]]; then
    return 0
  fi

  TV_APP_SKIP=1
  safe_log "[TV][DISABLE] $reason"
  { printf '[%s] [TV][DISABLE] %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$reason" >> "$TV_IMPORT_LOG"; } 2>/dev/null || true
}

acquire_lock
trap release_lock EXIT INT TERM
initialize_output_budget

encode_video() {
  local in_path="$1"
  local out_path="$2"

  if [[ -n "$FAST_ENCODER" ]]; then
    if [[ "$FAST_ENCODER" == "h264_videotoolbox" ]]; then
      ffmpeg -hide_banner -loglevel error -y \
        -nostdin \
        -i "$in_path" \
        -map 0:v:0 -map '0:a:0?' \
        -dn -sn -map_metadata -1 -map_chapters -1 \
        -c:v h264_videotoolbox -profile:v baseline -level:v 3.0 \
        -b:v "${VIDEO_BITRATE_K}k" -maxrate "${MAXRATE_K}k" -bufsize "${BUFSIZE_K}k" -g 300 -pix_fmt yuv420p \
        -vf "scale=640:480:force_original_aspect_ratio=increase,crop=640:480,setsar=1" \
        -r 30000/1001 \
        -c:a aac -b:a "${AUDIO_BITRATE_K}k" -ar 44100 -ac 2 \
        -movflags +faststart \
        "$out_path"
      return $?
    fi

    if [[ "$FAST_ENCODER" == "libx264" ]]; then
      ffmpeg -hide_banner -loglevel error -y \
        -nostdin \
        -i "$in_path" \
        -map 0:v:0 -map '0:a:0?' \
        -dn -sn -map_metadata -1 -map_chapters -1 \
        -c:v libx264 -preset veryfast -profile:v baseline -level:v 3.0 \
        -x264-params "cabac=0:ref=1:bframes=0:keyint=300:min-keyint=30:scenecut=40" \
        -b:v "${VIDEO_BITRATE_K}k" -maxrate "${MAXRATE_K}k" -bufsize "${BUFSIZE_K}k" -pix_fmt yuv420p \
        -vf "scale=640:480:force_original_aspect_ratio=increase,crop=640:480,setsar=1" \
        -r 30000/1001 \
        -c:a aac -b:a "${AUDIO_BITRATE_K}k" -ar 44100 -ac 2 \
        -movflags +faststart \
        "$out_path"
      return $?
    fi
  fi

  ffmpeg -hide_banner -loglevel error -y \
    -nostdin \
    -i "$in_path" \
    -map 0:v:0 -map '0:a:0?' \
    -dn -sn -map_metadata -1 -map_chapters -1 \
    -c:v mpeg4 -tag:v mp4v -b:v "${VIDEO_BITRATE_K}k" -maxrate "${MAXRATE_K}k" -bufsize "${BUFSIZE_K}k" -g 300 -bf 0 -pix_fmt yuv420p \
    -vf "scale=640:480:force_original_aspect_ratio=increase,crop=640:480,setsar=1" \
    -r 30000/1001 \
    -c:a aac -b:a "${AUDIO_BITRATE_K}k" -ar 44100 -ac 2 \
    -movflags +faststart \
    "$out_path"
}

clean_title() {
  local s="$1"
  s="${s//_/ }"
  s="${s//./ }"
  s="${s//-/ }"
  s="$(printf '%s' "$s" | sed -E 's/\[[^][]*\]//g; s/\([^()]*\)//g')"
  s="$(printf '%s' "$s" | perl -CSDA -pe 's/(^|\s)(480p|576p|720p|1080p|2160p|x264|x265|hevc|h264|h265|bluray|brrip|webrip|web[ -]?dl|nf|amzn|proper|repack|10bit|8bit|6ch|ddp?[0-9. ]*|aac[0-9. ]*|ac3|dts|atmos|yts|pahe\s*in)(?=\s|$)/ /ig; s/\b(5[ .]?1|7[ .]?1|2[ .]?0)\b/ /ig; s/\s+/ /g; s/^\s+|\s+$//g')"
  s="$(printf '%s' "$s" | sed -E 's/[[:space:]]+/ /g; s/^ +| +$//g')"
  printf '%s' "$s"
}

extract_year() {
  local s="$1"
  local y
  y="$(printf '%s' "$s" | sed -nE 's/.*\b((19|20)[0-9]{2})\b.*/\1/p' | head -n1)"
  printf '%s' "$y"
}

lookup_tvmaze_episode_title() {
  local show="$1"
  local season="$2"
  local ep="$3"
  local cached looked

  if [[ -z "$show" || -z "$season" || -z "$ep" ]]; then
    return 1
  fi

  cached="$(awk -F '\t' -v s="$show" -v se="$season" -v e="$ep" '$1 == s && $2 == se && $3 == e {print $4; exit}' "$TVMAZE_CACHE")"
  if [[ -n "$cached" ]]; then
    printf '%s' "$cached"
    return 0
  fi

  if ! command -v python3 >/dev/null 2>&1; then
    return 1
  fi

  looked="$(python3 - "$show" "$season" "$ep" <<'PY'
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

show = sys.argv[1]
season = int(sys.argv[2])
episode = int(sys.argv[3])

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "ipod-autoconvert/1.0"})
    with urllib.request.urlopen(req, timeout=12) as resp:
        return json.load(resp)

try:
    show_data = fetch("https://api.tvmaze.com/singlesearch/shows?q=" + urllib.parse.quote(show))
    show_id = show_data.get("id")
    if not show_id:
        raise SystemExit(0)
    ep_data = fetch(f"https://api.tvmaze.com/shows/{show_id}/episodebynumber?season={season}&number={episode}")
    name = (ep_data or {}).get("name", "").strip()
    if name:
        print(name)
except Exception:
    pass
PY
)"
  looked="$(printf '%s' "$looked" | tr '\n' ' ' | sed -E 's/[[:space:]]+/ /g; s/^ +| +$//g')"
  if [[ -n "$looked" ]]; then
    printf '%s\t%s\t%s\t%s\n' "$show" "$season" "$ep" "$looked" >> "$TVMAZE_CACHE"
    printf '%s' "$looked"
    return 0
  fi

  return 1
}

normalize_lookup_title() {
  printf '%s' "$1" | perl -CSDA -MUnicode::Normalize -pe '$_ = NFKD($_); s/\pM//g; $_ = lc $_; s/[^a-z0-9]+//g'
}

infer_show_from_path() {
  local rel="$1"
  local d parent grand
  d="$(dirname "$rel")"
  parent="$(basename "$d")"
  grand="$(basename "$(dirname "$d")")"

  if [[ "$parent" =~ ^[Ss][Ee][Aa][Ss][Oo][Nn][[:space:]]*[0-9]+$ ]]; then
    printf '%s' "$(clean_title "$grand")"
  else
    printf '%s' "$(clean_title "$parent")"
  fi
}

infer_season_from_path() {
  local rel="$1"

  if [[ "$rel" =~ /[Ss]eason[[:space:]_]*([0-9]{1,2})(/|$) ]]; then
    printf '%s' "$((10#${BASH_REMATCH[1]}))"
    return 0
  fi

  return 1
}

lookup_tvmaze_episode_number_by_title() {
  local show="$1"
  local season="$2"
  local episode_title="$3"
  local normalized cached looked

  if [[ -z "$show" || -z "$season" || -z "$episode_title" ]]; then
    return 1
  fi

  normalized="$(normalize_lookup_title "$episode_title")"
  if [[ -z "$normalized" ]]; then
    return 1
  fi

  cached="$(awk -F '\t' -v s="$show" -v se="$season" -v n="$normalized" '$1 == s && $2 == se && $3 == n {print $4 "\t" $5; exit}' "$TVMAZE_TITLE_CACHE")"
  if [[ -n "$cached" ]]; then
    printf '%s' "$cached"
    return 0
  fi

  if ! command -v python3 >/dev/null 2>&1; then
    return 1
  fi

  looked="$(python3 - "$show" "$season" "$episode_title" <<'PY'
import difflib
import json
import re
import sys
import unicodedata
import urllib.parse
import urllib.request

show = sys.argv[1]
season = int(sys.argv[2])
episode_title = sys.argv[3]

def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", "", text.lower())

def fetch(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "ipod-autoconvert/1.0"})
    with urllib.request.urlopen(req, timeout=12) as resp:
        return json.load(resp)

needle = normalize(episode_title)
if not needle:
    raise SystemExit(0)

try:
    show_data = fetch("https://api.tvmaze.com/singlesearch/shows?q=" + urllib.parse.quote(show))
    show_id = show_data.get("id")
    if not show_id:
        raise SystemExit(0)
    episodes = fetch(f"https://api.tvmaze.com/shows/{show_id}/episodes?specials=1")
except Exception:
    raise SystemExit(0)

exact = None
best = None
best_score = 0.0
for ep in episodes:
    if int(ep.get("season") or 0) != season:
        continue
    name = (ep.get("name") or "").strip()
    number = int(ep.get("number") or 0)
    normalized = normalize(name)
    if not normalized or number <= 0:
        continue
    if normalized == needle:
        exact = (number, name)
        break
    score = difflib.SequenceMatcher(None, needle, normalized).ratio()
    if needle in normalized or normalized in needle:
        score = max(score, 0.95)
    if score > best_score:
        best_score = score
        best = (number, name)

if exact:
    print(f"{exact[0]}\t{exact[1]}")
elif best and best_score >= 0.9:
    print(f"{best[0]}\t{best[1]}")
PY
)"
  looked="$(printf '%s' "$looked" | tr '\r' '\n' | sed -n '1p')"
  if [[ -n "$looked" ]]; then
    printf '%s\t%s\t%s\t%s\n' "$show" "$season" "$normalized" "$(printf '%s' "$looked" | cut -f1)" "$(printf '%s' "$looked" | cut -f2-)" >> "$TVMAZE_TITLE_CACHE"
    printf '%s' "$looked"
    return 0
  fi

  return 1
}

episode_title_needs_lookup() {
  local t="$1"
  t="$(printf '%s' "$t" | tr '[:upper:]' '[:lower:]' | sed -E 's/[[:space:]]+/ /g; s/^ +| +$//g')"
  if [[ -z "$t" ]]; then
    return 0
  fi
  if [[ "$t" =~ ^episode[[:space:]]*[0-9]{1,3}$ ]]; then
    return 0
  fi
  if [[ "$t" =~ (pahe|yts|x264|x265|1080p|720p|bluray|brrip|webrip|web[[:space:]-]?dl|web[[:space:]-]?hd|dd5|ddp|aac|ac3|dts|atmos|5[[:space:].]?1|7[[:space:].]?1|ph|ink) ]]; then
    return 0
  fi
  return 1
}

parse_tv() {
  local base_noext="$1"
  local rel="$2"
  local show season ep ep_tail ep_code before after

  if [[ "$base_noext" =~ [Ss]([0-9]{1,2})[[:space:]_.-]*[Ee]([0-9]{1,3}) ]]; then
    season="${BASH_REMATCH[1]}"
    ep="${BASH_REMATCH[2]}"
    before="$(printf '%s' "$base_noext" | sed -E 's/[[:space:]_.-]*[Ss][0-9]{1,2}[[:space:]_.-]*[Ee][0-9]{1,3}.*$//')"
    after="$(printf '%s' "$base_noext" | sed -E 's/^.*[Ss][0-9]{1,2}[[:space:]_.-]*[Ee][0-9]{1,3}[[:space:]_.-]*//')"
    show="$(clean_title "$before")"
    ep_tail="$(clean_title "$after")"
  elif [[ "$base_noext" =~ ([0-9]{1,2})[xX]([0-9]{1,3}) ]]; then
    season="${BASH_REMATCH[1]}"
    ep="${BASH_REMATCH[2]}"
    before="$(printf '%s' "$base_noext" | sed -E 's/[[:space:]_.-]*[0-9]{1,2}[xX][0-9]{1,3}.*$//')"
    after="$(printf '%s' "$base_noext" | sed -E 's/^.*[0-9]{1,2}[xX][0-9]{1,3}[[:space:]_.-]*//')"
    show="$(clean_title "$before")"
    ep_tail="$(clean_title "$after")"
  elif season="$(infer_season_from_path "$rel" 2>/dev/null)" && [[ -n "$season" ]]; then
    show="$(infer_show_from_path "$rel")"
    ep_tail="$(clean_title "$base_noext")"
    local title_lookup=""
    title_lookup="$(lookup_tvmaze_episode_number_by_title "$show" "$season" "$ep_tail" || true)"
    ep="$(printf '%s' "$title_lookup" | cut -f1)"
    if [[ -n "$ep" ]]; then
      local canonical_title
      canonical_title="$(printf '%s' "$title_lookup" | cut -f2-)"
      if [[ -n "$canonical_title" ]]; then
        ep_tail="$canonical_title"
      fi
    else
      return 1
    fi
  else
    return 1
  fi

  season="$((10#$season))"
  ep="$((10#$ep))"

  if [[ -z "$show" ]]; then
    show="$(infer_show_from_path "$rel")"
  fi

  if episode_title_needs_lookup "$ep_tail"; then
    local looked_up_title=""
    looked_up_title="$(lookup_tvmaze_episode_title "$show" "$season" "$ep" || true)"
    if [[ -n "$looked_up_title" ]]; then
      ep_tail="$looked_up_title"
    fi
  fi

  if [[ -z "$ep_tail" ]]; then
    ep_tail="Episode $(printf '%02d' "$ep")"
  fi

  ep_code="S$(printf '%02d' "$season")E$(printf '%02d' "$ep")"

  printf '%s\n' "$show" "$season" "$ep" "$ep_tail" "$ep_code"
}

is_tv_path() {
  local rel_lower="$1"
  if [[ "$rel_lower" == *"/tv shows/"* || "$rel_lower" == *"/shows i need to add/"* ]]; then
    return 0
  fi
  return 1
}

sanitize_filename_component() {
  local s="$1"
  s="$(printf '%s' "$s" | sed -E 's#[/:*?"<>|]# #g; s/[[:space:]]+/ /g; s/^ +| +$//g')"
  if [[ -z "$s" ]]; then
    s="Video"
  fi
  if [[ ${#s} -gt 190 ]]; then
    s="${s:0:190}"
    s="$(printf '%s' "$s" | sed -E 's/[[:space:]]+$//')"
  fi
  printf '%s' "$s"
}

lookup_mapped_output() {
  local rel="$1"
  awk -F '\t' -v key="$rel" '$1 == key {print $2; exit}' "$MAP_FILE"
}

was_imported_to_tv() {
  local out_path="$1"
  awk -F '\t' -v key="$out_path" '$1 == key {print 1; exit}' "$TV_IMPORTED_MAP"
}

tv_episode_exists_in_app() {
  local tv_show="$1"
  local tv_season="$2"
  local tv_episode="$3"
  local count_raw rc

  if [[ -z "$tv_show" || -z "$tv_season" || -z "$tv_episode" ]]; then
    return 1
  fi

  count_raw="$({ /usr/bin/osascript - "$tv_show" "$tv_season" "$tv_episode" <<'APPLESCRIPT'
on run argv
  set showName to item 1 of argv
  set seasonNum to item 2 of argv as integer
  set episodeNum to item 3 of argv as integer
  tell application "TV"
    set hitCount to count of (every file track of playlist "TV Shows" whose show is showName and season number is seasonNum and episode number is episodeNum)
  end tell
  return hitCount as text
end run
APPLESCRIPT
  } 2>&1)"
  rc=$?
  if [[ $rc -ne 0 ]]; then
    if [[ "$count_raw" == *"(-1712)"* ]]; then
      disable_tv_app_imports "TV duplicate check timed out; skipping TV imports for the rest of this batch."
    fi
    return 1
  fi

  count_raw="$(printf '%s' "$count_raw" | tr -cd '0-9')"
  if [[ -n "$count_raw" && "$count_raw" -gt 0 ]]; then
    return 0
  fi
  return 1
}

add_to_tv_app() {
  local out_path="$1"
  local tv_show="${2:-}"
  local tv_season="${3:-}"
  local tv_episode="${4:-}"

  if [[ ! -f "$out_path" ]]; then
    return 1
  fi

  if [[ "$TV_APP_SKIP" -ne 0 || "$tv_show" == "__skip__" ]]; then
    return 0
  fi

  if [[ -n "$(was_imported_to_tv "$out_path")" ]]; then
    return 0
  fi

  if tv_episode_exists_in_app "$tv_show" "$tv_season" "$tv_episode"; then
    printf '%s\t%s\n' "$out_path" "$(date '+%Y-%m-%d %H:%M:%S %Z')" >> "$TV_IMPORTED_MAP"
    echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] [TV][SKIP][EP-DUP] $(basename "$out_path") show='$tv_show' s=$tv_season e=$tv_episode" >> "$TV_IMPORT_LOG"
    echo "[TV][SKIP][EP-DUP] finish files/$(basename "$out_path") show='$tv_show' s=$tv_season e=$tv_episode" >> "$LOG"
    return 0
  fi

  if [[ "$TV_APP_SKIP" -ne 0 ]]; then
    return 0
  fi

  local result rc
  result="$({ /usr/bin/osascript - "$out_path" <<'APPLESCRIPT'
on run argv
  set mediaFile to POSIX file (item 1 of argv)
  tell application "TV"
    add mediaFile
  end tell
  return "ok"
end run
APPLESCRIPT
  } 2>&1)"
  rc=$?

  if [[ $rc -eq 0 ]]; then
    printf '%s\t%s\n' "$out_path" "$(date '+%Y-%m-%d %H:%M:%S %Z')" >> "$TV_IMPORTED_MAP"
    echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] [TV][ADDED] $(basename "$out_path")" >> "$TV_IMPORT_LOG"
    echo "[TV][ADDED] finish files/$(basename "$out_path")" >> "$LOG"
  else
    if [[ "$result" == *"(-1712)"* ]]; then
      disable_tv_app_imports "TV import timed out; skipping TV imports for the rest of this batch."
    fi
    echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] [TV][WARN] $(basename "$out_path") rc=$rc msg=$result" >> "$TV_IMPORT_LOG"
    echo "[TV][WARN] Failed to add finish files/$(basename "$out_path") to TV app" >> "$LOG"
  fi
}

convert_one() {
  local in="$1"
  local input_mtime=""

  if ! stop_batch_if_pause_requested; then
    return 1
  fi

  if ! stop_batch_if_source_missing; then
    return 1
  fi

  if ! ensure_output_budget_available; then
    return 1
  fi

  if [[ ! -f "$in" ]]; then
    safe_log "[SKIP][MISSING] ${in#"$SRC_ROOT"/}"
    return 1
  fi

  local rel="${in#"$SRC_ROOT"/}"
  input_mtime="$(stat -f '%m' "$in" 2>/dev/null || printf '0')"
  if [[ -n "$(lookup_failed_input "$rel" "$input_mtime")" ]]; then
    safe_log "[SKIP][FAILED] $rel"
    return 0
  fi

  local rel_lower
  rel_lower="$(printf '%s' "$rel" | tr '[:upper:]' '[:lower:]')"

  local base filename_noext
  base="$(basename "$in")"
  filename_noext="${base%.*}"

  local tv_parsed=1
  local show="" season="" ep="" ep_title="" ep_code=""
  if is_tv_path "/$rel_lower" || [[ "$filename_noext" =~ [Ss][0-9]{1,2}[Ee][0-9]{1,3} ]] || [[ "$filename_noext" =~ [0-9]{1,2}[xX][0-9]{1,3} ]]; then
    local tv_blob
    if tv_blob="$(parse_tv "$filename_noext" "$rel")"; then
      show="$(printf '%s\n' "$tv_blob" | sed -n '1p')"
      season="$(printf '%s\n' "$tv_blob" | sed -n '2p')"
      ep="$(printf '%s\n' "$tv_blob" | sed -n '3p')"
      ep_title="$(printf '%s\n' "$tv_blob" | sed -n '4p')"
      ep_code="$(printf '%s\n' "$tv_blob" | sed -n '5p')"
      tv_parsed=0
    fi
  fi

  local movie_title="" year="" genre="" movie_file_title=""
  local out_base
  if [[ $tv_parsed -eq 0 ]]; then
    out_base="$(sanitize_filename_component "$show - S$(printf '%02d' "$season")E$(printf '%02d' "$ep") - $ep_title")"
  else
    movie_title="$(clean_title "$filename_noext")"
    year="$(extract_year "$filename_noext")"
    genre="$(clean_title "$(basename "$(dirname "$rel")")")"
    movie_file_title="$(printf '%s' "$movie_title" | sed -E 's/[[:space:]]+(19|20)[0-9]{2}$//; s/[[:space:]]+$//')"
    if [[ -z "$movie_file_title" ]]; then
      movie_file_title="$movie_title"
    fi
    out_base="$(sanitize_filename_component "$movie_file_title")"
  fi

  local mapped_name mapped_path
  mapped_name="$(lookup_mapped_output "$rel")"
  if [[ -n "$mapped_name" ]]; then
    mapped_path="$FINISH_DIR/$mapped_name"
    if [[ -f "$mapped_path" ]]; then
      safe_log "[SKIP] $rel -> finish files/$mapped_name"
      return 0
    fi
  fi

  local out temp_out
  out="$FINISH_DIR/$out_base.mp4"
  if [[ -f "$out" || -f "${out%.mp4}.tmp.mp4" ]]; then
    printf '%s\t%s\n' "$rel" "$(basename "$out")" >> "$MAP_FILE"
    safe_log "[SKIP][DUP] $rel -> finish files/$(basename "$out")"
    return 0
  fi
  temp_out="${out%.mp4}.tmp.mp4"
  rm -f "$temp_out"

  safe_log "[START] $rel"

  if ! encode_video "$in" "$temp_out"; then
    safe_log "[FAIL][CONVERT] $rel"
    record_failed_input "$rel" "$input_mtime" "convert"
    rm -f "$temp_out"
    return 1
  fi

  local temp_bytes=0
  temp_bytes="$(stat -f '%z' "$temp_out" 2>/dev/null || printf '0')"
  if [[ "$TARGET_BYTES" -gt 0 ]] && (( CURRENT_OUTPUT_BYTES + temp_bytes > TARGET_BYTES )); then
    rm -f "$temp_out"
    stop_batch_due_to_target "Skipping $rel because adding $(bytes_to_gb "$temp_bytes") GB would exceed the ${TARGET_GB} GB target."
    return 1
  fi

  if [[ $tv_parsed -eq 0 ]]; then
    if ! AtomicParsley "$temp_out" \
        --stik "TV Show" \
        --TVShowName "$show" \
        --title "$ep_title" \
        --TVEpisode "$ep_code" \
        --TVSeasonNum "$season" \
        --TVEpisodeNum "$ep" \
        --album "$show, Season $season" \
        --artist "$show" \
        --overWrite >/dev/null 2>&1; then
      safe_log "[WARN][TAG] TV tagging failed for $rel"
    else
      safe_log "[TAG][TV] $rel => show='$show' s=$season e=$ep title='$ep_title'"
    fi
  else
    if [[ -n "$year" ]]; then
      AtomicParsley "$temp_out" \
        --stik "Movie" \
        --title "$movie_title" \
        --artist "$movie_title" \
        --album "$movie_title" \
        --genre "$genre" \
        --year "$year" \
        --overWrite >/dev/null 2>&1 || safe_log "[WARN][TAG] Movie tagging failed for $rel"
    else
      AtomicParsley "$temp_out" \
        --stik "Movie" \
        --title "$movie_title" \
        --artist "$movie_title" \
        --album "$movie_title" \
        --genre "$genre" \
        --overWrite >/dev/null 2>&1 || safe_log "[WARN][TAG] Movie tagging failed for $rel"
    fi

    safe_log "[TAG][MOVIE] $rel => title='$movie_title' year='${year:-n/a}' genre='$genre'"
  fi

  mv -f "$temp_out" "$out"
  CURRENT_OUTPUT_BYTES=$((CURRENT_OUTPUT_BYTES + temp_bytes))
  printf '%s\t%s\n' "$rel" "$(basename "$out")" >> "$MAP_FILE"
  safe_log "[DONE] $rel -> finish files/$(basename "$out")"
  if [[ $tv_parsed -eq 0 ]]; then
    add_to_tv_app "$out" "$show" "$season" "$ep"
  else
    add_to_tv_app "$out" "__skip__"
  fi
}

safe_log "[$(date)] Starting iPod conversion + tagging batch"
safe_log "[$(date)] Quality preset=$QUALITY_PRESET video=${VIDEO_BITRATE_K}k audio=${AUDIO_BITRATE_K}k maxrate=${MAXRATE_K}k bufsize=${BUFSIZE_K}k"
if [[ "$TARGET_BYTES" -gt 0 ]]; then
  safe_log "[$(date)] Output cap enabled: ${TARGET_GB} GB at $FINISH_DIR"
fi
if [[ "$TV_APP_SKIP" -ne 0 ]]; then
  safe_log "[$(date)] TV app import disabled for this batch."
fi
if [[ "$TV_ONLY" -eq 1 ]]; then
  safe_log "[$(date)] TV-only mode enabled; movie pass will be skipped."
fi

if ! ensure_output_budget_available; then
  safe_log "[$(date)] Finished iPod conversion + tagging batch"
  exit 0
fi

if [[ -n "$SINGLE_INPUT" ]]; then
  convert_one "$SINGLE_INPUT"
else
  count=0
  # Priority TV pass: process requested shows first, in rank order.
  for pattern in "${PRIORITY_SHOW_PATTERNS[@]}"; do
    if [[ "$LIMIT" -gt 0 && "$count" -ge "$LIMIT" ]]; then
      break
    fi

    while IFS= read -r -d '' file; do
      convert_one "$file"
      count=$((count + 1))
      if [[ "$STOP_BATCH" -ne 0 || ( "$LIMIT" -gt 0 && "$count" -ge "$LIMIT" ) ]]; then
        break
      fi
    done < <(
      find "$SRC_ROOT" \
        \( -path "$DEST_ROOT" -o -path "$DEST_ROOT/*" -o -path "$SRC_ROOT/.Spotlight-V100" -o -path "$SRC_ROOT/.Trashes" -o -path "$SRC_ROOT/.DocumentRevisions-V100" -o -path "$SRC_ROOT/.TemporaryItems" \) -prune -o \
        -type f \( -iname "*.mp4" -o -iname "*.m4v" -o -iname "*.mov" -o -iname "*.avi" -o -iname "*.mkv" -o -iname "*.wmv" -o -iname "*.flv" -o -iname "*.webm" -o -iname "*.mpg" -o -iname "*.mpeg" -o -iname "*.3gp" -o -iname "*.mts" -o -iname "*.m2ts" \) \
        -ipath "*${pattern}*" -print0
    )

    if [[ "$STOP_BATCH" -ne 0 ]]; then
      break
    fi
  done

  # Remaining TV pass: process all other TV-show folder content before movies.
  if [[ "$STOP_BATCH" -eq 0 && ( "$LIMIT" -eq 0 || "$count" -lt "$LIMIT" ) ]]; then
    while IFS= read -r -d '' file; do
      convert_one "$file"
      count=$((count + 1))
      if [[ "$STOP_BATCH" -ne 0 || ( "$LIMIT" -gt 0 && "$count" -ge "$LIMIT" ) ]]; then
        break
      fi
    done < <(
      find "$SRC_ROOT" \
        \( -path "$DEST_ROOT" -o -path "$DEST_ROOT/*" -o -path "$SRC_ROOT/.Spotlight-V100" -o -path "$SRC_ROOT/.Trashes" -o -path "$SRC_ROOT/.DocumentRevisions-V100" -o -path "$SRC_ROOT/.TemporaryItems" \) -prune -o \
        -type f \( -iname "*.mp4" -o -iname "*.m4v" -o -iname "*.mov" -o -iname "*.avi" -o -iname "*.mkv" -o -iname "*.wmv" -o -iname "*.flv" -o -iname "*.webm" -o -iname "*.mpg" -o -iname "*.mpeg" -o -iname "*.3gp" -o -iname "*.mts" -o -iname "*.m2ts" \) \
        \( -ipath "*/tv shows/*" -o -ipath "*/shows i need to add/*" \) \
        ! \( -ipath "*sopranos*" -o -ipath "*breaking bad*" -o -ipath "*the office*" -o -ipath "*succession*" -o -ipath "*white lotus*" -o -ipath "*severance*" -o -ipath "*plurbuis*" -o -ipath "*plurbus*" -o -ipath "*pluribus*" \) -print0
    )
  fi

  # Final pass: process everything else (movies/non-TV).
  if [[ "$STOP_BATCH" -eq 0 && "$TV_ONLY" -eq 0 && ( "$LIMIT" -eq 0 || "$count" -lt "$LIMIT" ) ]]; then
    while IFS= read -r -d '' file; do
      convert_one "$file"
      count=$((count + 1))
      if [[ "$STOP_BATCH" -ne 0 || ( "$LIMIT" -gt 0 && "$count" -ge "$LIMIT" ) ]]; then
        break
      fi
    done < <(
      find "$SRC_ROOT" \
        \( -path "$DEST_ROOT" -o -path "$DEST_ROOT/*" -o -path "$SRC_ROOT/.Spotlight-V100" -o -path "$SRC_ROOT/.Trashes" -o -path "$SRC_ROOT/.DocumentRevisions-V100" -o -path "$SRC_ROOT/.TemporaryItems" \) -prune -o \
        -type f \( -iname "*.mp4" -o -iname "*.m4v" -o -iname "*.mov" -o -iname "*.avi" -o -iname "*.mkv" -o -iname "*.wmv" -o -iname "*.flv" -o -iname "*.webm" -o -iname "*.mpg" -o -iname "*.mpeg" -o -iname "*.3gp" -o -iname "*.mts" -o -iname "*.m2ts" \) \
        ! \( -ipath "*/tv shows/*" -o -ipath "*/shows i need to add/*" \) -print0
    )
  elif [[ "$TV_ONLY" -eq 1 ]]; then
    safe_log "[$(date)] TV-only mode complete; skipping movie pass."
  fi
fi

safe_log "[$(date)] Finished iPod conversion + tagging batch"
