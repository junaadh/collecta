#!/usr/bin/env bash
set -euo pipefail

COMPOSE=(docker compose --env-file .env -f infra/docker-compose.yml)

"${COMPOSE[@]}" build web
"${COMPOSE[@]}" up --remove-orphans -d
