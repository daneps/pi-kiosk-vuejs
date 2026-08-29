#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-remote.sh
source "$script_dir/pi-remote.sh"

include_logs=false
if [[ "${1:-}" == "--logs" ]]; then include_logs=true; fi

pi_ssh '
printf "%s\n" "--- system ---"
date
uptime
who -b
printf "%s\n" "--- network ---"
hostname -I
printf "%s\n" "--- kiosk API ---"
curl --silent --show-error --max-time 5 -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/ || true
printf "%s\n" "--- cron ---"
systemctl is-active cron || true
crontab -l 2>&1 || true
printf "%s\n" "--- processes ---"
pm2 status
ps -eo pid,etimes,stat,comm,args | grep -E "chromium|pi-kiosk-browser|labwc" | grep -v grep || true
printf "%s\n" "--- display mode ---"
DISPLAY=:0 XAUTHORITY="$HOME/.Xauthority" xrandr --current 2>/dev/null | grep " connected" || true
printf "%s\n" "--- HDMI ---"
for connector in /sys/class/drm/card*-HDMI-A-*/status; do printf "%s: " "$connector"; cat "$connector"; done
'

if [[ "$include_logs" == true ]]; then
  pi_ssh '
printf "%s\n" "--- browser log ---"
tail -150 /tmp/pi-kiosk-browser.log 2>&1 || true
printf "%s\n" "--- API errors ---"
tail -150 ~/.pm2/logs/pi-kiosk-api-error.log 2>&1 || true
printf "%s\n" "--- current boot warnings ---"
journalctl -b --no-pager 2>&1 | grep -iE "chromium|gpu|drm|oom|under.?voltage|error|fail" | tail -200 || true
printf "%s\n" "--- cron activity ---"
journalctl -u cron --since "yesterday" --no-pager 2>&1 | tail -100 || true
'
fi
