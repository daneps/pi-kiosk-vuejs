#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=pi-remote.sh
source "$script_dir/pi-remote.sh"

timestamp="$(date +%Y%m%d-%H%M%S)"
output_dir="${PI_DIAGNOSTICS_DIR:-/private/tmp}"
output_path="${1:-$output_dir/pi-kiosk-screen-$timestamp.png}"
remote_path="/tmp/pi-kiosk-screen-$timestamp.png"

mkdir -p "$(dirname "$output_path")"
cleanup() { pi_ssh "rm -f '$remote_path'" >/dev/null 2>&1 || true; }
trap cleanup EXIT

pi_ssh "DISPLAY=:0 XAUTHORITY='$pi_user_home/.Xauthority' scrot '$remote_path'"
pi_scp_from "$remote_path" "$output_path"
printf 'Screenshot saved to %s\n' "$output_path"
