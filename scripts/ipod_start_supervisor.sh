#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SESSION_NAME="ipod_supervisor"

if pgrep -f "$SCRIPT_DIR/ipod_background_supervisor.sh" >/dev/null 2>&1; then
  printf 'Supervisor process is already running.\n'
  exit 0
fi

if screen -ls 2>/dev/null | grep -F ".${SESSION_NAME}" >/dev/null 2>&1; then
  printf 'Supervisor screen is already running.\n'
  exit 0
fi

cmd="$(printf '%q' "$SCRIPT_DIR/ipod_background_supervisor.sh")"
screen -dmS "$SESSION_NAME" /bin/bash -lc "$cmd"
printf 'Started supervisor screen session: %s\n' "$SESSION_NAME"
