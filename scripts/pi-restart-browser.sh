#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-remote.sh
source "$script_dir/pi-remote.sh"

pi_ssh "pkill -x chromium || true; sleep 2; nohup env DISPLAY=:0 XAUTHORITY='$pi_user_home/.Xauthority' '$pi_app_dir/scripts/pi-kiosk-browser.sh' </dev/null >/tmp/pi-kiosk-browser.log 2>&1 &"
printf 'Chromium restart requested on %s.\n' "$pi_host"
