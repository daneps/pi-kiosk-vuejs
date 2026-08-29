#!/usr/bin/env bash
set -euo pipefail

# Intended for the kiosk user's crontab. It deliberately restarts only
# Chromium; the API remains managed separately by PM2.
pi_user_home="${PI_USER_HOME:-$HOME}"
pi_app_dir="${PI_APP_DIR:-$pi_user_home/pi-kiosk-vuejs}"
state_dir="${XDG_RUNTIME_DIR:-/tmp}"
lock_file="$state_dir/pi-kiosk-watchdog.lock"
last_restart_file="$state_dir/pi-kiosk-watchdog.last-restart"
cooldown_seconds=300

exec 9>"$lock_file"
flock -n 9 || exit 0

log() {
  logger -t pi-kiosk-watchdog -- "$*" || true
  printf '%s %s\n' "$(date -Is)" "$*"
}

healthy=true
curl --silent --show-error --fail --max-time 10 http://127.0.0.1:3000/ >/dev/null || healthy=false
pgrep -x chromium >/dev/null || healthy=false
curl --silent --show-error --fail --max-time 10 http://127.0.0.1:9222/json/version >/dev/null || healthy=false

if "$healthy"; then
  exit 0
fi

now=$(date +%s)
if [[ -f "$last_restart_file" ]]; then
  last_restart=$(cat "$last_restart_file" 2>/dev/null || printf '0')
  if [[ "$last_restart" =~ ^[0-9]+$ ]] && (( now - last_restart < cooldown_seconds )); then
    log "health check failed; restart skipped during ${cooldown_seconds}s cooldown"
    exit 1
  fi
fi

printf '%s\n' "$now" >"$last_restart_file"
log "health check failed; restarting Chromium"
pkill -x chromium || true
sleep 2
nohup env DISPLAY=:0 XAUTHORITY="$pi_user_home/.Xauthority" "$pi_app_dir/scripts/pi-kiosk-browser.sh" \
  </dev/null >/tmp/pi-kiosk-browser.log 2>&1 &
