#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

SRC_DIR="/Volumes/4 tb backup/codex ipod ready/finish files"
DEST_DIR="/Volumes/4 tb backup/codex ipod ready/finish files compact"
LOG_FILE="/Volumes/4 tb backup/codex ipod ready/recompress_ipod_library.log"
LIMIT=0
QUALITY_PRESET="compact"
VIDEO_BITRATE_K=768
AUDIO_BITRATE_K=96
MAXRATE_K=900
BUFSIZE_K=1800
ENCODER=""

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
    --source-dir)
      SRC_DIR="${2:-}"
      shift 2
      ;;
    --dest-dir)
      DEST_DIR="${2:-}"
      shift 2
      ;;
    --limit)
      LIMIT="${2:-0}"
      shift 2
      ;;
    --quality)
      apply_quality_preset "${2:-}"
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

mkdir -p "$DEST_DIR"
touch "$LOG_FILE"

if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q '\bh264_videotoolbox\b'; then
  ENCODER="h264_videotoolbox"
elif ffmpeg -hide_banner -encoders 2>/dev/null | grep -q '\blibx264\b'; then
  ENCODER="libx264"
else
  ENCODER="mpeg4"
fi

extract_atom_value() {
  local dump="$1"
  local atom="$2"
  printf '%s\n' "$dump" | sed -n "s/^Atom \"$atom\" contains: //p" | head -n 1
}

encode_one() {
  local src="$1"
  local rel="${src#"$SRC_DIR"/}"
  local dest="$DEST_DIR/$rel"
  local tmp="${dest%.*}.tmp.mp4"
  local tag_dump stik title album artist genre year tvshow tvep tvseason tvepisode

  mkdir -p "$(dirname "$dest")"
  if [[ -f "$dest" ]]; then
    echo "[SKIP] $rel" >> "$LOG_FILE"
    return 0
  fi

  echo "[START] $rel" >> "$LOG_FILE"
  rm -f "$tmp"

  if [[ "$ENCODER" == "h264_videotoolbox" ]]; then
    ffmpeg -hide_banner -loglevel error -y \
      -nostdin \
      -i "$src" \
      -map 0:v:0 -map '0:a:0?' \
      -dn -sn -map_metadata -1 -map_chapters -1 \
      -c:v h264_videotoolbox -profile:v baseline -level:v 3.0 \
      -b:v "${VIDEO_BITRATE_K}k" -maxrate "${MAXRATE_K}k" -bufsize "${BUFSIZE_K}k" -g 300 -pix_fmt yuv420p \
      -vf "scale=640:480:force_original_aspect_ratio=increase,crop=640:480,setsar=1" \
      -r 30000/1001 \
      -c:a aac -b:a "${AUDIO_BITRATE_K}k" -ar 44100 -ac 2 \
      -movflags +faststart \
      "$tmp"
  elif [[ "$ENCODER" == "libx264" ]]; then
    ffmpeg -hide_banner -loglevel error -y \
      -nostdin \
      -i "$src" \
      -map 0:v:0 -map '0:a:0?' \
      -dn -sn -map_metadata -1 -map_chapters -1 \
      -c:v libx264 -preset veryfast -profile:v baseline -level:v 3.0 \
      -x264-params "cabac=0:ref=1:bframes=0:keyint=300:min-keyint=30:scenecut=40" \
      -b:v "${VIDEO_BITRATE_K}k" -maxrate "${MAXRATE_K}k" -bufsize "${BUFSIZE_K}k" -pix_fmt yuv420p \
      -vf "scale=640:480:force_original_aspect_ratio=increase,crop=640:480,setsar=1" \
      -r 30000/1001 \
      -c:a aac -b:a "${AUDIO_BITRATE_K}k" -ar 44100 -ac 2 \
      -movflags +faststart \
      "$tmp"
  else
    ffmpeg -hide_banner -loglevel error -y \
      -nostdin \
      -i "$src" \
      -map 0:v:0 -map '0:a:0?' \
      -dn -sn -map_metadata -1 -map_chapters -1 \
      -c:v mpeg4 -tag:v mp4v -b:v "${VIDEO_BITRATE_K}k" -maxrate "${MAXRATE_K}k" -bufsize "${BUFSIZE_K}k" -g 300 -bf 0 -pix_fmt yuv420p \
      -vf "scale=640:480:force_original_aspect_ratio=increase,crop=640:480,setsar=1" \
      -r 30000/1001 \
      -c:a aac -b:a "${AUDIO_BITRATE_K}k" -ar 44100 -ac 2 \
      -movflags +faststart \
      "$tmp"
  fi

  tag_dump="$(AtomicParsley "$src" -t 2>/dev/null || true)"
  stik="$(extract_atom_value "$tag_dump" "stik")"
  title="$(extract_atom_value "$tag_dump" "©nam")"
  album="$(extract_atom_value "$tag_dump" "©alb")"
  artist="$(extract_atom_value "$tag_dump" "©ART")"
  genre="$(extract_atom_value "$tag_dump" "©gen")"
  year="$(extract_atom_value "$tag_dump" "©day")"
  tvshow="$(extract_atom_value "$tag_dump" "tvsh")"
  tvep="$(extract_atom_value "$tag_dump" "tven")"
  tvseason="$(extract_atom_value "$tag_dump" "tvsn")"
  tvepisode="$(extract_atom_value "$tag_dump" "tves")"

  if [[ "$stik" == "TV Show" ]]; then
    AtomicParsley "$tmp" \
      --stik "TV Show" \
      --TVShowName "$tvshow" \
      --title "$title" \
      --TVEpisode "$tvep" \
      --TVSeasonNum "$tvseason" \
      --TVEpisodeNum "$tvepisode" \
      --album "$album" \
      --artist "$artist" \
      --overWrite >/dev/null 2>&1 || true
  else
    if [[ -n "$year" ]]; then
      AtomicParsley "$tmp" \
        --stik "Movie" \
        --title "$title" \
        --album "$album" \
        --artist "$artist" \
        --genre "$genre" \
        --year "$year" \
        --overWrite >/dev/null 2>&1 || true
    else
      AtomicParsley "$tmp" \
        --stik "Movie" \
        --title "$title" \
        --album "$album" \
        --artist "$artist" \
        --genre "$genre" \
        --overWrite >/dev/null 2>&1 || true
    fi
  fi

  mv -f "$tmp" "$dest"
  echo "[DONE] $rel" >> "$LOG_FILE"
}

echo "[$(date)] Starting recompress preset=$QUALITY_PRESET video=${VIDEO_BITRATE_K}k audio=${AUDIO_BITRATE_K}k encoder=$ENCODER" >> "$LOG_FILE"
count=0
while IFS= read -r -d '' file; do
  encode_one "$file"
  count=$((count + 1))
  if [[ "$LIMIT" -gt 0 && "$count" -ge "$LIMIT" ]]; then
    break
  fi
done < <(find "$SRC_DIR" -type f \( -iname "*.mp4" -o -iname "*.m4v" \) -print0)
echo "[$(date)] Finished recompress count=$count" >> "$LOG_FILE"
