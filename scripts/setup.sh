#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if [ ! -e ".env" ]; then
  ./scripts/setup-env.sh
else
  printf '.env already exists; using existing file.\n' >&2
  printf '\n.env\n' >&2
  sed 's/^/  /' .env
fi

set -a
source .env
set +a

bun install
bun run up

postgres_port="${POSTGRES_PORT:-5432}"
postgres_user="${POSTGRES_USER:-collecta}"
postgres_db="${POSTGRES_DB:-collecta}"

printf 'waiting for postgres on localhost:%s...\n' "$postgres_port"
for _ in {1..30}; do
  if docker compose --env-file .env -f infra/docker-compose.yml exec -T postgres pg_isready -U "$postgres_user" -d "$postgres_db" >/dev/null 2>&1; then
    printf 'postgres is ready\n'
    break
  fi

  sleep 1
done

if ! docker compose --env-file .env -f infra/docker-compose.yml exec -T postgres pg_isready -U "$postgres_user" -d "$postgres_db" >/dev/null 2>&1; then
  printf 'postgres did not become ready on localhost:%s\n' "$postgres_port" >&2
  exit 1
fi

bun run db:push
bun run db:seed
