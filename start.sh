#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"
test -f "$root/.env" || { echo 'Missing .env; copy .env.example and set secrets.' >&2; exit 1; }
test -d "$root/node_modules" -a -d "$root/client/node_modules" || { echo 'Dependencies absent; run scripts/bootstrap.sh.' >&2; exit 1; }
set -a; . "$root/.env"; set +a
server_port="${BACKEND_PORT:-${PORT:-3001}}"
client_port="${CLIENT_PORT:-${FRONTEND_PORT:-5173}}"
for port in "$server_port" "$client_port"; do ! lsof -ti ":$port" >/dev/null 2>&1 || { echo "Port $port is in use; refusing to terminate it." >&2; exit 1; }; done
if [[ "${MIGRATE_ON_START:-false}" == "true" ]]; then
  [[ "${ALLOW_SCHEMA_MIGRATION:-}" == "1" || "${ALLOW_SCHEMA_MIGRATION:-}" == "true" ]] || { echo "MIGRATE_ON_START requires ALLOW_SCHEMA_MIGRATION=1." >&2; exit 1; }
  bash "$root/scripts/migrate.sh"
  node "$root/server/create-admin.js"
fi
(cd "$root" && PORT="$server_port" npm run server) & server_pid=$!
(cd "$root/client" && ./node_modules/.bin/vite --host 127.0.0.1 --port "$client_port") & client_pid=$!
cleanup(){ kill "$server_pid" "$client_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
wait "$server_pid" "$client_pid"
