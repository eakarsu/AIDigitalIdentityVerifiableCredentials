#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"
test -f "$root/.env" || { echo 'Missing .env; copy .env.example and set secrets.' >&2; exit 1; }
test -d "$root/node_modules" -a -d "$root/client/node_modules" || { echo 'Dependencies absent; run scripts/bootstrap.sh.' >&2; exit 1; }
for port in "${PORT:-3001}" "${CLIENT_PORT:-5173}"; do ! lsof -ti ":$port" >/dev/null 2>&1 || { echo "Port $port is in use; refusing to terminate it." >&2; exit 1; }; done
(cd "$root" && npm run server) & server_pid=$!
(cd "$root/client" && npm run dev -- --port "${CLIENT_PORT:-5173}") & client_pid=$!
cleanup(){ kill "$server_pid" "$client_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
wait "$server_pid" "$client_pid"
