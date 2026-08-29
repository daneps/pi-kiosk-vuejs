#!/usr/bin/env bash
# Shared local connection setup for Pi maintenance scripts. Source this file; do not run it directly.
set -euo pipefail

pi_script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pi_project_dir="$(cd "$pi_script_dir/.." && pwd)"
pi_local_config="$pi_project_dir/.pi-kiosk.env"

if [[ -f "$pi_local_config" ]]; then
  # shellcheck disable=SC1090
  source "$pi_local_config"
fi

pi_host="${PI_HOST:?Set PI_HOST or create .pi-kiosk.env from .pi-kiosk.env.example.}"
pi_user="${PI_USER:-${pi_host%@*}}"
pi_app_dir="${PI_APP_DIR:-/home/$pi_user/pi-kiosk-vuejs}"
pi_user_home="${PI_USER_HOME:-/home/$pi_user}"

pi_ssh_args=(-o BatchMode=yes)
pi_scp_args=(-o BatchMode=yes)
if [[ -n "${PI_SSH_KEY:-}" ]]; then
  pi_ssh_args=(-i "$PI_SSH_KEY" "${pi_ssh_args[@]}")
  pi_scp_args=(-i "$PI_SSH_KEY" "${pi_scp_args[@]}")
fi

pi_ssh() {
  ssh "${pi_ssh_args[@]}" "$pi_host" "$@"
}

pi_scp_from() {
  local remote_path="$1"
  local local_path="$2"
  scp "${pi_scp_args[@]}" "$pi_host:$remote_path" "$local_path"
}
