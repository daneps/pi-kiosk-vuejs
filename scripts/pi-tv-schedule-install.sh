#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-remote.sh
source "$script_dir/pi-remote.sh"

schedule=$(printf '%s\n' \
  "# pi-kiosk-tv-schedule" \
  "30 6 * * * $pi_app_dir/scripts/pi-kiosk-tv.sh on # pi-kiosk-tv-schedule" \
  "30 8 * * * $pi_app_dir/scripts/pi-kiosk-tv.sh off # pi-kiosk-tv-schedule" \
  "0 17 * * * $pi_app_dir/scripts/pi-kiosk-tv.sh on # pi-kiosk-tv-schedule" \
  "0 21 * * * $pi_app_dir/scripts/pi-kiosk-tv.sh off # pi-kiosk-tv-schedule")
schedule_base64=$(printf '%s\n' "$schedule" | base64 | tr -d '\n')

pi_ssh "chmod 755 '$pi_app_dir/scripts/pi-kiosk-tv.sh' && (crontab -l 2>/dev/null | grep -v 'pi-kiosk-tv-schedule' || true; printf '%s' '$schedule_base64' | base64 -d) | crontab - && crontab -l | grep 'pi-kiosk-tv-schedule'"
printf 'Installed the configured Pi CEC TV schedule on %s.\n' "$pi_host"
