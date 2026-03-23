#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/ipod_project_config.sh"

MODE="manual"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --autorun)
      MODE="autorun"
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

ipod_ensure_project_dirs
touch "$IPOD_PIPELINE_LOG"

log_line() {
  printf '[%s] [%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$MODE" "$1" >> "$IPOD_PIPELINE_LOG"
}

acquire_lock() {
  if mkdir "$IPOD_PIPELINE_LOCK_DIR" 2>/dev/null; then
    printf '%s\n' "$$" > "$IPOD_PIPELINE_LOCK_DIR/pid"
    return 0
  fi

  if [[ -f "$IPOD_PIPELINE_LOCK_DIR/pid" ]]; then
    local prior_pid
    prior_pid="$(cat "$IPOD_PIPELINE_LOCK_DIR/pid" 2>/dev/null || true)"
    if [[ -n "$prior_pid" ]] && kill -0 "$prior_pid" 2>/dev/null; then
      log_line "Pipeline already running under pid $prior_pid; skipping duplicate launch."
      exit 0
    fi
  fi

  rm -rf "$IPOD_PIPELINE_LOCK_DIR" 2>/dev/null || true
  mkdir "$IPOD_PIPELINE_LOCK_DIR"
  printf '%s\n' "$$" > "$IPOD_PIPELINE_LOCK_DIR/pid"
}

release_lock() {
  rm -rf "$IPOD_PIPELINE_LOCK_DIR" 2>/dev/null || true
}

screen_is_running() {
  pgrep -f "$IPOD_VIDEO_ROOT" >/dev/null 2>&1
}

start_video_stage() {
  if [[ -f "$IPOD_PAUSE_FLAG" ]]; then
    log_line "Pause flag present; video stage not started."
    return 0
  fi

  if screen_is_running; then
    log_line "Video stage already running in screen $IPOD_SCREEN_NAME."
    return 0
  fi

  local command_string screen_pid
  command_string="$(printf '%q ' \
    "$SCRIPT_DIR/ipod_convert_and_tag.sh" \
    --dest-root "$IPOD_VIDEO_ROOT" \
    --fast \
    --quality "$IPOD_VIDEO_QUALITY_PRESET" \
    --target-gb "$IPOD_VIDEO_TARGET_GB" \
    --skip-tv-app \
    --pause-flag "$IPOD_PAUSE_FLAG")"
  command_string="${command_string}>> $(printf '%q' "$IPOD_VIDEO_STDOUT") 2>&1"

  if ! screen -dmS "$IPOD_SCREEN_NAME" /bin/bash -lc "$command_string"; then
    log_line "Failed to start video stage screen $IPOD_SCREEN_NAME."
    return 1
  fi
  sleep 1
  screen_pid="$(screen -ls 2>/dev/null | awk -v name="$IPOD_SCREEN_NAME" '$1 ~ ("\\." name "$") {split($1, a, "."); print a[1]; exit}' || true)"
  if [[ -n "$screen_pid" ]]; then
    nohup caffeinate -dimsu -w "$screen_pid" >/dev/null 2>&1 &
    log_line "Started video stage in screen $IPOD_SCREEN_NAME (pid $screen_pid)."
  else
    log_line "Started video stage in screen $IPOD_SCREEN_NAME."
  fi
}

run_spotify_stage() {
  local client_id token_cache
  token_cache="$HOME/.codex/spotify_oauth_token.json"
  client_id="${SPOTIFY_CLIENT_ID:-$IPOD_SPOTIFY_CLIENT_ID_DEFAULT}"

  if [[ ! -d "$IPOD_MUSIC_ROOT" ]]; then
    log_line "Spotify stage skipped; missing music root $IPOD_MUSIC_ROOT."
    return 0
  fi

  if [[ ! -f "$token_cache" ]]; then
    log_line "Spotify stage skipped; no cached Spotify token yet."
    return 0
  fi

  log_line "Running Spotify liked-songs stage."
  if env PYTHONUNBUFFERED=1 /usr/bin/env python3 "$SCRIPT_DIR/spotify_to_apple_music.py" \
      --spotify-use-api \
      --spotify-client-id "$client_id" \
      --spotify-liked-songs \
      --non-interactive-auth \
      --apple-playlist-name "$IPOD_SPOTIFY_PLAYLIST_NAME" \
      --music-root "$IPOD_MUSIC_ROOT" \
      --min-score "$IPOD_SPOTIFY_MIN_SCORE" \
      --import-mode applescript \
      --music-timeout 3600 \
      --report "$IPOD_SPOTIFY_REPORT" >>"$IPOD_SPOTIFY_LOG" 2>&1; then
    log_line "Spotify liked-songs stage completed."
  else
    log_line "Spotify liked-songs stage failed; see $IPOD_SPOTIFY_LOG."
  fi
}

run_podcast_stage() {
  log_line "Running MSSP stage."
  if /usr/bin/env python3 "$SCRIPT_DIR/download_mssp_to_stage.py" \
      --dest-dir "$IPOD_PODCAST_STAGE_DIR" \
      --manifest "$IPOD_PODCAST_MANIFEST" >>"$IPOD_PODCAST_LOG" 2>&1; then
    log_line "MSSP stage completed."
  else
    log_line "MSSP stage failed; see $IPOD_PODCAST_LOG."
  fi
}

run_photo_stage() {
  log_line "Running photo stage."
  if /bin/bash "$SCRIPT_DIR/ipod_stage_photos.sh" >>"$IPOD_PHOTO_LOG" 2>&1; then
    log_line "Photo stage completed."
  else
    log_line "Photo stage failed; see $IPOD_PHOTO_LOG."
  fi
}

acquire_lock
trap release_lock EXIT INT TERM

if [[ ! -d "$IPOD_TARGET_VOLUME" ]]; then
  log_line "Target volume not mounted; pipeline skipped."
  exit 0
fi

if [[ -f "$IPOD_PAUSE_FLAG" ]]; then
  log_line "Pause flag present; pipeline skipped."
  "$SCRIPT_DIR/ipod_project_status.sh" --output "$IPOD_STATUS_REPORT" >/dev/null
  exit 0
fi

start_video_stage
run_podcast_stage
run_photo_stage
run_spotify_stage
"$SCRIPT_DIR/ipod_project_status.sh" --output "$IPOD_STATUS_REPORT" >/dev/null
log_line "Pipeline run complete."
