#!/usr/bin/env bash
set -euo pipefail

docker compose -f infra/docker-compose.yml up --build --remove-orphans -d
