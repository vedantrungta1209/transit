#!/bin/bash
# Pull latest images and restart all services.
# Usage: cd ~/transit && bash infra/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Pulling latest images ==="
docker compose -f docker-compose.prod.yml pull

echo "=== Restarting services ==="
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "=== Waiting for API to be healthy ==="
sleep 5
docker compose -f docker-compose.prod.yml ps

echo "=== Deploy complete ==="
echo "  API:   https://api.transitco.in"
echo "  Admin: https://admin.transitco.in"
