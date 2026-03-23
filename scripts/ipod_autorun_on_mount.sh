#!/usr/bin/env bash
set -u

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_SCRIPT="$SCRIPT_DIR/ipod_project_config.sh"
TARGET_VOLUME="/Volumes/4 tb backup"
VIDEO_SCRIPT="$SCRIPT_DIR/ipod_convert_and_tag.sh"
PIPELINE_SCRIPT="$SCRIPT_DIR/ipod_stage_all.sh"
SPOTIFY_SCRIPT="$SCRIPT_DIR/spotify_to_apple_music.py"
AUTORUN_LOG="$SCRIPT_DIR/ipod_autorun.log"
VIDEO_OUTPUT="/tmp/ipod_convert_and_tag.out"
SPOTIFY_OUTPUT="/tmp/spotify_liked_autorun.log"
VIDEO_QUALITY_PRESET="very-compact"
VIDEO_TARGET_GB="400"
VIDEO_DEST_ROOT="$TARGET_VOLUME/codex ipod ready 400gb"
SPOTIFY_PLAYLIST_NAME="for iPod"
SPOTIFY_MIN_SCORE="90"
SPOTIFY_MUSIC_ROOT="$TARGET_VOLUME/MUSIC"
SPOTIFY_REPORT_DIR="$SCRIPT_DIR/reports"
SPOTIFY_CLIENT_ID_DEFAULT="1fd5039188e3488b940933da79591fe1"
RUN_MODE="direct"
TERMINAL_FALLBACK_ENABLED=0
AUTORUN_LOCK_DIR="/tmp/ipod_autorun_on_mount.lock"
AUTORUN_DEBOUNCE_SECONDS=300
AUTORUN_LAST_FILE="$SCRIPT_DIR/.last_autorun_trigger_epoch"
AUTORUN_TARGET_STATE_FILE="$SCRIPT_DIR/.last_target_volume_state"
IPOD_SYNC_COOLDOWN_SECONDS=1800
IPOD_SYNC_LAST_FILE="$SCRIPT_DIR/.last_ipod_sync_epoch"
SPOTIFY_SYNC_COOLDOWN_SECONDS=1800
SPOTIFY_SYNC_LAST_FILE="$SCRIPT_DIR/.last_spotify_sync_epoch"
FINDER_DEVICE_NAME_HINT="iPod"
SUPERVISOR_START_SCRIPT="$SCRIPT_DIR/ipod_start_supervisor.sh"

if [[ -f "$CONFIG_SCRIPT" ]]; then
  # shellcheck disable=SC1090
  source "$CONFIG_SCRIPT"
  TARGET_VOLUME="$IPOD_TARGET_VOLUME"
  VIDEO_OUTPUT="$IPOD_PIPELINE_LOG"
fi

timestamp() {
  date '+%Y-%m-%d %H:%M:%S %Z'
}

log_line() {
  echo "[$(timestamp)] $1" >> "$AUTORUN_LOG"
}

shell_quote() {
  printf '%q' "$1"
}

read_epoch_file() {
  local epoch_file="$1"
  local value

  if [[ ! -f "$epoch_file" ]]; then
    return 1
  fi

  value="$(tr -cd '0-9' < "$epoch_file" 2>/dev/null || true)"
  if [[ "$value" =~ ^[0-9]+$ ]]; then
    printf '%s' "$value"
    return 0
  fi

  return 1
}

cooldown_age() {
  local epoch_file="$1"
  local cooldown_seconds="$2"
  local now last_epoch age

  now="$(date +%s)"
  last_epoch="$(read_epoch_file "$epoch_file" || true)"
  if [[ "$last_epoch" =~ ^[0-9]+$ ]]; then
    age=$((now - last_epoch))
    if (( age >= 0 && age < cooldown_seconds )); then
      printf '%s' "$age"
      return 0
    fi
  fi

  return 1
}

mark_now() {
  local epoch_file="$1"
  printf '%s\n' "$(date +%s)" > "$epoch_file"
}

read_state_file() {
  local state_file="$1"
  if [[ ! -f "$state_file" ]]; then
    return 1
  fi
  tr -cd '[:alpha:]-' < "$state_file" 2>/dev/null || true
}

write_state_file() {
  local state_file="$1"
  local value="$2"
  printf '%s\n' "$value" > "$state_file"
}

can_write_target_volume() {
  local probe_dir="${IPOD_PROJECT_ROOT:-$TARGET_VOLUME/codex ipod ready}"
  local probe_file="$probe_dir/.autorun_write_probe_$$"

  mkdir -p "$probe_dir" 2>/dev/null || return 1
  if : > "$probe_file" 2>/dev/null; then
    rm -f "$probe_file" 2>/dev/null || true
    return 0
  fi
  return 1
}

run_in_terminal() {
  local shell_cmd="$1"
  local task_name="$2"
  local slug
  local command_file

  slug="$(printf '%s' "$task_name" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/_/g; s/^_+|_+$//g')"
  if [[ -z "$slug" ]]; then
    slug="job"
  fi
  command_file="$SCRIPT_DIR/.autorun_${slug}.command"

  cat >"$command_file" <<EOF
#!/usr/bin/env bash
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
$shell_cmd
status=\$?
current_tty="\$(tty 2>/dev/null || true)"
if [[ -n "\$current_tty" ]]; then
  /usr/bin/osascript - "\$current_tty" <<'APPLESCRIPT'
on run argv
  set targetTTY to item 1 of argv
  tell application "Terminal"
    repeat with w in windows
      set tabCount to count of tabs of w
      repeat with idx from tabCount to 1 by -1
        set t to tab idx of w
        try
          if tty of t is targetTTY then
            if (count of tabs of w) > 1 then
              close t saving no
            else
              close w saving no
            end if
            return
          end if
        end try
      end repeat
    end repeat
  end tell
end run
APPLESCRIPT
fi
exit "\$status"
EOF
  chmod +x "$command_file"

  if /usr/bin/open -g -a Terminal "$command_file" >/dev/null 2>&1; then
    log_line "Started $task_name in Terminal fallback mode."
    return 0
  fi

  log_line "Failed to start $task_name in Terminal fallback mode."
  return 1
}

acquire_autorun_lock() {
  if mkdir "$AUTORUN_LOCK_DIR" 2>/dev/null; then
    printf '%s\n' "$$" > "$AUTORUN_LOCK_DIR/pid"
    return 0
  fi

  if [[ -f "$AUTORUN_LOCK_DIR/pid" ]]; then
    local prior_pid
    prior_pid="$(cat "$AUTORUN_LOCK_DIR/pid" 2>/dev/null || true)"
    if [[ -n "$prior_pid" ]] && kill -0 "$prior_pid" 2>/dev/null; then
      log_line "Autorun lock held by pid $prior_pid, skipping duplicate trigger."
      exit 0
    fi
  fi

  rm -rf "$AUTORUN_LOCK_DIR" 2>/dev/null || true
  mkdir "$AUTORUN_LOCK_DIR"
  printf '%s\n' "$$" > "$AUTORUN_LOCK_DIR/pid"
}

release_autorun_lock() {
  rm -rf "$AUTORUN_LOCK_DIR" 2>/dev/null || true
}

resolve_spotify_client_id() {
  if [[ -n "${SPOTIFY_CLIENT_ID:-}" ]]; then
    printf '%s' "$SPOTIFY_CLIENT_ID"
    return 0
  fi

  local cache_file="$HOME/.codex/spotify_oauth_token.json"
  if [[ -f "$cache_file" ]]; then
    local from_cache
    from_cache="$(python3 - "$cache_file" <<'PY'
import json
import sys

path = sys.argv[1]
try:
    data = json.load(open(path, "r", encoding="utf-8"))
except Exception:
    print("")
    raise SystemExit(0)
print((data.get("client_id") or "").strip())
PY
)"
    if [[ -n "$from_cache" ]]; then
      printf '%s' "$from_cache"
      return 0
    fi
  fi

  if [[ -n "$SPOTIFY_CLIENT_ID_DEFAULT" ]]; then
    printf '%s' "$SPOTIFY_CLIENT_ID_DEFAULT"
    return 0
  fi

  return 1
}

start_ipod_sync() {
  local now age
  now="$(date +%s)"

  if [[ "${IPOD_AUTORUN_DISABLE_FINAL_SYNC:-0}" -eq 1 ]]; then
    log_line "iPod auto-sync disabled until the final March sync window."
    return 0
  fi

  if [[ "$RUN_MODE" != "direct" ]]; then
    log_line "iPod auto-sync skipped (non-interactive launch context)."
    return 0
  fi

  age="$(cooldown_age "$IPOD_SYNC_LAST_FILE" "$IPOD_SYNC_COOLDOWN_SECONDS" || true)"
  if [[ -n "$age" ]]; then
    log_line "iPod sync cooldown active (${age}s < ${IPOD_SYNC_COOLDOWN_SECONDS}s), skip auto-sync."
    return 0
  fi

  local sync_result
  sync_result="$(/usr/bin/osascript - "$FINDER_DEVICE_NAME_HINT" <<'APPLESCRIPT'
on run argv
set deviceHint to item 1 of argv
try
  tell application "Finder"
    activate
    if (count of Finder windows) = 0 then make new Finder window
  end tell

  delay 0.8

  tell application "System Events"
    tell process "Finder"
      set targetWindow to window 1
      tell outline 1 of scroll area 1 of splitter group 1 of targetWindow
        set foundDevice to false
        repeat with r in rows
          try
            set rowName to name of UI element 1 of r as text
            if rowName contains deviceHint then
              click UI element 1 of r
              set foundDevice to true
              exit repeat
            end if
          end try
        end repeat
      end tell

      if foundDevice is false then
        return "no-ipod"
      end if

      delay 1.2

      try
        click checkbox "General" of splitter group 1 of splitter group 1 of targetWindow
        delay 0.5
      end try

      if exists button "Sync" of splitter group 1 of splitter group 1 of targetWindow then
        click button "Sync" of splitter group 1 of splitter group 1 of targetWindow
        return "sync-started:finder"
      end if
    end tell
  end tell

  return "no-sync-button"
on error errMsg number errNum
  return "error:" & (errNum as text) & ":" & errMsg
end try
end run
APPLESCRIPT
)"

  case "$sync_result" in
    sync-started:*)
      printf '%s\n' "$now" > "$IPOD_SYNC_LAST_FILE"
      log_line "iPod auto-sync started ($sync_result)."
      ;;
    no-ipod)
      ;;
    *)
      log_line "iPod auto-sync failed: $sync_result"
      ;;
  esac
}

start_stage_pipeline() {
  if [[ "$RUN_MODE" == "terminal-disabled" ]]; then
    log_line "Stage pipeline skipped (Terminal fallback disabled)."
    return 0
  fi

  if [[ ! -x "$PIPELINE_SCRIPT" ]]; then
    log_line "Stage pipeline script missing or not executable: $PIPELINE_SCRIPT"
    return 1
  fi

  if pgrep -f "$PIPELINE_SCRIPT" >/dev/null 2>&1; then
    log_line "Stage pipeline already running, skip auto-start."
    return 0
  fi

  log_line "SSD mounted; starting staged pipeline at ${IPOD_PROJECT_ROOT:-$TARGET_VOLUME}."
  if [[ "$RUN_MODE" == "terminal" ]]; then
    local pipeline_cmd
    pipeline_cmd="nohup /bin/bash $(shell_quote "$PIPELINE_SCRIPT") --autorun >>$(shell_quote "$VIDEO_OUTPUT") 2>&1 &"
    run_in_terminal "$pipeline_cmd" "ipod stage pipeline"
    return $?
  fi

  nohup /bin/bash "$PIPELINE_SCRIPT" --autorun >>"$VIDEO_OUTPUT" 2>&1 &
  log_line "Started staged pipeline PID $! (direct mode)"
}

start_supervisor_if_needed() {
  if [[ "$RUN_MODE" == "terminal-disabled" ]]; then
    log_line "Supervisor auto-start skipped (launch context cannot write directly to SSD path)."
    return 0
  fi

  if [[ ! -x "$SUPERVISOR_START_SCRIPT" ]]; then
    log_line "Supervisor start script missing or not executable: $SUPERVISOR_START_SCRIPT"
    return 1
  fi

  if screen -ls 2>/dev/null | grep -F '.ipod_supervisor' >/dev/null 2>&1; then
    log_line "Supervisor already running."
    return 0
  fi

  if /bin/bash "$SUPERVISOR_START_SCRIPT" >>"$VIDEO_OUTPUT" 2>&1; then
    log_line "Started supervisor after SSD mount."
    return 0
  fi

  log_line "Failed to start supervisor after SSD mount."
  return 1
}

mkdir -p "$(dirname "$AUTORUN_LOG")"
touch "$AUTORUN_LOG"
acquire_autorun_lock
trap release_autorun_lock EXIT INT TERM

if [[ ! -d "$TARGET_VOLUME" ]]; then
  write_state_file "$AUTORUN_TARGET_STATE_FILE" "unmounted"
  log_line "SSD not mounted, nothing to do."
  exit 0
fi

paused_before_autorun=0
if [[ -f "$IPOD_PAUSE_FLAG" ]]; then
  paused_before_autorun=1
fi

previous_target_state="$(read_state_file "$AUTORUN_TARGET_STATE_FILE" || true)"
fresh_reconnect=0
if [[ "$previous_target_state" == "unmounted" ]]; then
  fresh_reconnect=1
fi
write_state_file "$AUTORUN_TARGET_STATE_FILE" "mounted"

autorun_age="$(cooldown_age "$AUTORUN_LAST_FILE" "$AUTORUN_DEBOUNCE_SECONDS" || true)"
if [[ -n "$autorun_age" && "$paused_before_autorun" -eq 0 && "$fresh_reconnect" -eq 0 ]]; then
  log_line "Mount debounce active (${autorun_age}s < ${AUTORUN_DEBOUNCE_SECONDS}s), skip autorun."
  exit 0
fi
if [[ -n "$autorun_age" && "$paused_before_autorun" -eq 1 ]]; then
  log_line "Bypassing mount debounce because the project is paused and the target SSD is connected."
fi
if [[ -n "$autorun_age" && "$fresh_reconnect" -eq 1 ]]; then
  log_line "Bypassing mount debounce because the target SSD was unplugged and reconnected."
fi
mark_now "$AUTORUN_LAST_FILE"

if can_write_target_volume; then
  RUN_MODE="direct"
else
  if [[ "$TERMINAL_FALLBACK_ENABLED" -eq 1 ]]; then
    RUN_MODE="terminal"
    log_line "Launch context cannot write directly to SSD path; using Terminal fallback."
  else
    RUN_MODE="terminal-disabled"
    log_line "Launch context cannot write directly to SSD path; Terminal fallback disabled to avoid opening extra windows."
  fi
fi

if [[ "$fresh_reconnect" -eq 1 && -f "$IPOD_PAUSE_FLAG" ]]; then
  rm -f "$IPOD_PAUSE_FLAG"
  log_line "Cleared pause flag because the target SSD was unplugged and reconnected."
fi

if [[ -f "$IPOD_PAUSE_FLAG" ]]; then
  log_line "Pause flag present without a fresh reconnect; keeping project stopped."
  exit 0
fi

start_supervisor_if_needed
start_stage_pipeline
start_ipod_sync
