#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/ipod_project_config.sh"

ipod_ensure_project_dirs

"$SCRIPT_DIR/ipod_project_status.sh" --output "$IPOD_DESKTOP_NOTE" >/dev/null

printf '%s\n' "$(date '+%Y-%m-%d')" > "$IPOD_DAILY_NOTE_STAMP"

/usr/bin/osascript - "$IPOD_DESKTOP_NOTE" <<'APPLESCRIPT' >/dev/null 2>&1 || true
on run argv
  set notePath to POSIX file (item 1 of argv)
  tell application "TextEdit"
    activate
    open notePath
  end tell
  display notification "Desktop status note refreshed." with title "iPod Project"
end run
APPLESCRIPT
