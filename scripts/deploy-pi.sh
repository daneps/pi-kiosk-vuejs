#!/usr/bin/env bash
set -euo pipefail

# Required: PI_HOST='pi@raspberrypi.local' npm run deploy:pi
pi_host="${PI_HOST:?Set PI_HOST to the kiosk's SSH target.}"
pi_user="${PI_USER:-${pi_host%@*}}"
pi_app_dir="${PI_APP_DIR:-/home/$pi_user/pi-kiosk-vuejs}"
pi_user_home="${PI_USER_HOME:-/home/$pi_user}"
pi_ssh_key="${PI_SSH_KEY:-}"

ssh_args=(-o BatchMode=yes)
if [[ -n "$pi_ssh_key" ]]; then
  ssh_args=(-i "$pi_ssh_key" "${ssh_args[@]}")
fi

ssh_command=(ssh "${ssh_args[@]}")
rsync_ssh="${ssh_command[*]}"

./node_modules/.bin/vue-tsc -b
./node_modules/.bin/vite build

rsync -az --delete \
  --exclude .git/ \
  --exclude .env \
  --exclude .env.* \
  --exclude node_modules/ \
  --exclude backend/data/photos/source/ \
  -e "$rsync_ssh" \
  ./ "$pi_host:$pi_app_dir/"

"${ssh_command[@]}" "$pi_host" "cd '$pi_app_dir' && chmod 755 scripts/pi-kiosk-browser.sh && npm install --omit=dev && (pm2 reload pi-kiosk-api --update-env || pm2 start ecosystem.config.cjs --only pi-kiosk-api) && pm2 save && pkill -x chromium || true; sleep 2; nohup env DISPLAY=:0 XAUTHORITY='$pi_user_home/.Xauthority' '$pi_app_dir/scripts/pi-kiosk-browser.sh' </dev/null >/tmp/pi-kiosk-browser.log 2>&1 &"

echo "Deployed and refreshed $pi_host."
