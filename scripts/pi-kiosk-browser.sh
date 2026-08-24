#!/usr/bin/env bash
set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"
pi_user_home="${PI_USER_HOME:-$HOME}"
export XAUTHORITY="${XAUTHORITY:-$pi_user_home/.Xauthority}"

# Wait for the production Express server before opening Chromium.
until curl --silent --fail http://127.0.0.1:3000/ >/dev/null; do
  sleep 2
done

# Chromium 149 requires GLES 3, which the Raspberry Pi 3's active hardware
# path cannot provide. Keep ANGLE, but have it render in software.
exec /usr/bin/chromium \
  --kiosk \
  --user-data-dir="$pi_user_home/.local/share/pi-kiosk-chromium" \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-session-crashed-bubble \
  --password-store=basic \
  --use-gl=swiftshader \
  --use-angle=swiftshader \
  --start-maximized \
  --ozone-platform=x11 \
  --kiosk \
  http://127.0.0.1:3000/
