#!/bin/bash
# Get initial Let's Encrypt certs. Run once after DNS is pointed at this server.
# Usage: cd ~/transit && bash infra/init-ssl.sh
set -euo pipefail

EMAIL="vedantrungta@gmail.com"
DOMAINS=("api.transitco.in" "admin.transitco.in")

cd "$(dirname "$0")/.."

mkdir -p infra/certbot/conf infra/certbot/www

echo "=== Starting temporary nginx for ACME challenge ==="
docker run --rm -d \
  --name nginx-init \
  -p 80:80 \
  -v "$PWD/infra/certbot/www:/var/www/certbot:ro" \
  -v "$PWD/infra/nginx.init.conf:/etc/nginx/nginx.conf:ro" \
  nginx:alpine

echo "=== Issuing certificates ==="
for DOMAIN in "${DOMAINS[@]}"; do
  docker run --rm \
    -v "$PWD/infra/certbot/conf:/etc/letsencrypt" \
    -v "$PWD/infra/certbot/www:/var/www/certbot" \
    certbot/certbot certonly \
      --webroot \
      --webroot-path=/var/www/certbot \
      --email "$EMAIL" \
      --agree-tos \
      --no-eff-email \
      -d "$DOMAIN"
done

echo "=== Stopping temporary nginx ==="
docker stop nginx-init

echo "=== Certs issued! Now starting the full stack ==="
bash "$(dirname "$0")/deploy.sh"
