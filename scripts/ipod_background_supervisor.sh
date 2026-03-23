#!/usr/bin/env bash
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/ipod_project_config.sh"

LOOP_SECONDS=600

while [[ $# -gt 0 ]]; do
  case "$1" in
    --loop-seconds)
      LOOP_SECONDS="${2:-$LOOP_SECONDS}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

ipod_ensure_project_dirs
touch "$IPOD_SUPERVISOR_LOG"
printf '%s\n' "$$" > "$IPOD_SUPERVISOR_PID_FILE"

log_line() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$1" >> "$IPOD_SUPERVISOR_LOG"
}

log_line "Supervisor started (loop=${LOOP_SECONDS}s)."

while true; do
  today="$(date '+%Y-%m-%d')"
  now_hhmm="$(date '+%H%M')"
  target_hhmm="$(printf '%02d%02d' "$IPOD_DAILY_NOTE_HOUR" "$IPOD_DAILY_NOTE_MINUTE")"
  last_shown="$(cat "$IPOD_DAILY_NOTE_STAMP" 2>/dev/null || true)"
  if [[ "$last_shown" != "$today" && "$now_hhmm" -ge "$target_hhmm" ]]; then
    if /bin/bash "$SCRIPT_DIR/ipod_daily_note.sh" >>"$IPOD_SUPERVISOR_LOG" 2>&1; then
      log_line "Daily note refreshed for ${IPOD_DAILY_NOTE_HOUR}:$(printf '%02d' "$IPOD_DAILY_NOTE_MINUTE")."
    else
      log_line "Daily note refresh failed."
    fi
  fi

  if [[ -d "$IPOD_TARGET_VOLUME" ]]; then
    if /bin/bash "$SCRIPT_DIR/ipod_stage_all.sh" --autorun >>"$IPOD_SUPERVISOR_LOG" 2>&1; then
      log_line "Stage pipeline check completed."
    else
      log_line "Stage pipeline check failed."
    fi
  else
    log_line "Target volume not mounted; waiting."
  fi

  sleep_seconds="$LOOP_SECONDS"
  if [[ "$last_shown" != "$today" ]]; then
    now_epoch="$(date '+%s')"
    target_epoch="$(date -j -f '%Y-%m-%d %H:%M:%S' "$today $(printf '%02d:%02d:00' "$IPOD_DAILY_NOTE_HOUR" "$IPOD_DAILY_NOTE_MINUTE")" '+%s')"
    if [[ -n "$target_epoch" && "$now_epoch" -lt "$target_epoch" ]]; then
      until_target=$((target_epoch - now_epoch))
      if (( until_target > 0 && until_target < sleep_seconds )); then
        sleep_seconds="$until_target"
      fi
    fi
  fi

  if (( sleep_seconds < 1 )); then
    sleep_seconds=1
  fi

  sleep "$sleep_seconds"
done
