#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/ipod_project_config.sh"

SOURCE_DIR="$IPOD_PHOTO_SOURCE_DIR"
DEST_DIR="$IPOD_PHOTO_STAGE_DIR"
TARGET_GB="$IPOD_PHOTO_TARGET_GB"
MANIFEST="$DEST_DIR/photo_manifest.tsv"
FAILED_MAP="$DEST_DIR/failed_inputs.tsv"
LOG="$IPOD_PHOTO_LOG"
TARGET_BYTES=0
CURRENT_BYTES=0
STOP_BATCH=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source-dir)
      SOURCE_DIR="${2:-$SOURCE_DIR}"
      shift 2
      ;;
    --dest-dir)
      DEST_DIR="${2:-$DEST_DIR}"
      MANIFEST="$DEST_DIR/photo_manifest.tsv"
      FAILED_MAP="$DEST_DIR/failed_inputs.tsv"
      shift 2
      ;;
    --target-gb)
      TARGET_GB="${2:-$TARGET_GB}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

mkdir -p "$DEST_DIR" "$SOURCE_DIR" "$(dirname "$LOG")"
touch "$MANIFEST" "$FAILED_MAP" "$LOG"

log_line() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$1" >> "$LOG"
}

bytes_to_gb() {
  awk -v bytes="$1" 'BEGIN { printf "%.2f", bytes / 1000000000 }'
}

gb_to_bytes() {
  awk -v gb="$1" 'BEGIN { printf "%.0f", gb * 1000000000 }'
}

dir_bytes() {
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    printf '0'
    return 0
  fi
  find "$dir" -type f -exec stat -f '%z' {} \; | awk '{s+=$1} END {print s+0}'
}

manifest_lookup() {
  local rel="$1"
  local mtime="$2"
  awk -F '\t' -v key="$rel" -v mt="$mtime" '$1 == key && $2 == mt {print $3; exit}' "$MANIFEST"
}

failed_lookup() {
  local rel="$1"
  local mtime="$2"
  awk -F '\t' -v key="$rel" -v mt="$mtime" '$1 == key && $2 == mt {print $3; exit}' "$FAILED_MAP"
}

sanitize_component() {
  local value="$1"
  value="$(printf '%s' "$value" | sed -E 's#[/:*?"<>|]# #g; s/[[:space:]]+/ /g; s/^ +| +$//g')"
  if [[ -z "$value" ]]; then
    value="photo"
  fi
  printf '%s' "$value"
}

relative_dest_for() {
  local src="$1"
  local rel="${src#"$SOURCE_DIR"/}"
  local dir_part file_part stem out_dir

  dir_part="$(dirname "$rel")"
  file_part="$(basename "$rel")"
  stem="${file_part%.*}"
  out_dir="$DEST_DIR"
  if [[ "$dir_part" != "." ]]; then
    out_dir="$out_dir/$dir_part"
  fi
  mkdir -p "$out_dir"
  printf '%s/%s.jpg' "$out_dir" "$(sanitize_component "$stem")"
}

mark_failed() {
  local rel="$1"
  local mtime="$2"
  local reason="$3"
  if [[ -z "$(failed_lookup "$rel" "$mtime")" ]]; then
    printf '%s\t%s\t%s\n' "$rel" "$mtime" "$reason" >> "$FAILED_MAP"
  fi
}

TARGET_BYTES="$(gb_to_bytes "$TARGET_GB")"
CURRENT_BYTES="$(dir_bytes "$DEST_DIR")"

log_line "Starting photo stage target=${TARGET_GB} GB source=$SOURCE_DIR dest=$DEST_DIR current=$(bytes_to_gb "$CURRENT_BYTES") GB"

if [[ ! -d "$SOURCE_DIR" ]]; then
  log_line "Photo source directory missing; created placeholder and exiting."
  mkdir -p "$SOURCE_DIR"
  exit 0
fi

while IFS= read -r -d '' src; do
  if [[ "$STOP_BATCH" -ne 0 ]]; then
    break
  fi

  rel="${src#"$SOURCE_DIR"/}"
  mtime="$(stat -f '%m' "$src" 2>/dev/null || printf '0')"

  if [[ -n "$(failed_lookup "$rel" "$mtime")" ]]; then
    continue
  fi

  existing_rel="$(manifest_lookup "$rel" "$mtime" || true)"
  if [[ -n "$existing_rel" && -f "$DEST_DIR/$existing_rel" ]]; then
    continue
  fi

  if (( CURRENT_BYTES >= TARGET_BYTES )); then
    log_line "Reached photo target (${TARGET_GB} GB)."
    break
  fi

  out="$(relative_dest_for "$src")"
  out_rel="${out#"$DEST_DIR"/}"
  tmp="${out%.jpg}.tmp.jpg"
  rm -f "$tmp"

  if ! sips -s format jpeg -s formatOptions 60 --resampleHeightWidthMax 1600 "$src" --out "$tmp" >/dev/null 2>&1; then
    mark_failed "$rel" "$mtime" "sips"
    rm -f "$tmp"
    log_line "FAIL $rel"
    continue
  fi

  out_bytes="$(stat -f '%z' "$tmp" 2>/dev/null || printf '0')"
  if (( CURRENT_BYTES + out_bytes > TARGET_BYTES )); then
    rm -f "$tmp"
    STOP_BATCH=1
    log_line "Stopping before $rel because it would exceed the ${TARGET_GB} GB photo budget."
    break
  fi

  mv -f "$tmp" "$out"
  CURRENT_BYTES=$((CURRENT_BYTES + out_bytes))
  printf '%s\t%s\t%s\n' "$rel" "$mtime" "$out_rel" >> "$MANIFEST"
  log_line "DONE $rel -> $out_rel"
done < <(
  find "$SOURCE_DIR" -type f \
    \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.heic' -o -iname '*.heif' -o -iname '*.tif' -o -iname '*.tiff' \) \
    -print0
)

log_line "Finished photo stage current=$(bytes_to_gb "$CURRENT_BYTES") GB"
