#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/ipod_project_config.sh"

rm -f "$IPOD_PAUSE_FLAG"
/bin/bash "$SCRIPT_DIR/ipod_stage_all.sh"
/bin/bash "$SCRIPT_DIR/ipod_start_supervisor.sh"
