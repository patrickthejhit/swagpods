#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/ipod_project_config.sh"

ipod_ensure_project_dirs
printf '%s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" > "$IPOD_PAUSE_FLAG"

if screen -ls 2>/dev/null | grep -F ".ipod_supervisor" >/dev/null 2>&1; then
  screen -S ipod_supervisor -X quit || true
fi

pkill -f "$SCRIPT_DIR/ipod_background_supervisor.sh" >/dev/null 2>&1 || true

printf 'Project paused. No new background work will start, and any active converter will stop before the next file.\n'
