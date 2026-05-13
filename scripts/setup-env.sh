#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

generate_hex() {
  local bytes="$1"

  openssl rand -hex "$bytes"
}

write_env() {
  local jwt_secret postgres_password

  jwt_secret="$(generate_hex 64)"
  postgres_password="$(generate_hex 24)"

  cat >"$ENV_FILE" <<ENV
# Collecta local development environment
NODE_ENV=development
PORT=4000

# Auth
JWT_SECRET=$jwt_secret
JWT_EXPIRES_IN=8h
AUTH_MAX_FAILED_LOGIN_ATTEMPTS=5
AUTH_LOCK_DURATION_SECONDS=900

# Postgres
POSTGRES_USER=collecta
POSTGRES_PASSWORD=$postgres_password
POSTGRES_DB=collecta
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Web
NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true
NEXT_PUBLIC_API_URL=/api/v1
ENV
}

if [ -e "$ENV_FILE" ] && [ "${SETUP_ENV_FORCE:-0}" != "1" ]; then
  printf '%s already exists; keeping existing file. Set SETUP_ENV_FORCE=1 to regenerate.\n' "${ENV_FILE#$ROOT_DIR/}" >&2
else
  write_env
  printf 'created %s\n' "${ENV_FILE#$ROOT_DIR/}" >&2
fi

printf '\n%s\n' "${ENV_FILE#$ROOT_DIR/}" >&2
sed 's/^/  /' "$ENV_FILE"
