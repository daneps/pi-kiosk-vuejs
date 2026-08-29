#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-remote.sh
source "$script_dir/pi-remote.sh"

watchdog_line="*/2 * * * * PI_APP_DIR=$pi_app_dir PI_USER_HOME=$pi_user_home $pi_app_dir/scripts/pi-kiosk-watchdog.sh >/tmp/pi-kiosk-watchdog.log 2>&1 # pi-kiosk-watchdog"

pi_ssh "(crontab -l 2>/dev/null | grep -v 'pi-kiosk-watchdog' || true; printf '%s\\n' '$watchdog_line') | crontab - && chmod 755 '$pi_app_dir/scripts/pi-kiosk-watchdog.sh' && crontab -l | grep 'pi-kiosk-watchdog'"
printf 'Installed the Pi kiosk browser watchdog on %s (every two minutes).\n' "$pi_host"
