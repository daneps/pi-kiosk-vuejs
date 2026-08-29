#!/usr/bin/env bash
set -euo pipefail

# Configure the Pi as a CEC playback device for each invocation. The HDMI
# adapter can lose its logical address after a reboot or HDMI/TV power change.
log_file="/tmp/pi-kiosk-cec.log"

exec >>"$log_file" 2>&1
printf '%s %s\n' "$(date -Is)" "CEC action: ${1:-missing}"

cec() {
  /usr/bin/cec-ctl --playback --osd-name PiKiosk --verbose "$@"
}

case "${1:-}" in
  on)
    cec --to 0 --image-view-on
    sleep 2
    cec --active-source phys-addr=1.0.0.0
    ;;
  off)
    cec --to 0 --standby
    ;;
  *)
    printf 'Usage: %s {on|off}\n' "$0"
    exit 2
    ;;
esac
