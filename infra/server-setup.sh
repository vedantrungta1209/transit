#!/bin/bash
# Run once on a fresh Ubuntu 22.04 server as the ubuntu user.
# Usage: bash server-setup.sh
set -euo pipefail

echo "=== Installing Docker ==="
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

echo "=== Cloning repo ==="
git clone https://github.com/vedantrungta1209/transit.git ~/transit
cd ~/transit

echo "=== Logging in to GHCR ==="
echo "Enter your GitHub Personal Access Token (read:packages scope):"
read -s GHCR_TOKEN
echo "$GHCR_TOKEN" | docker login ghcr.io -u vedantrungta1209 --password-stdin

echo ""
echo "=== Done! Next steps ==="
echo "  1. Copy your .env files:"
echo "     scp apps/api/.env ubuntu@<server-ip>:~/transit/apps/api/.env"
echo "  2. Create ~/transit/.env with DB_USER, DB_PASSWORD, REDIS_PASSWORD"
echo "  3. Point DNS: api.transitco.in + admin.transitco.in → this server's IP"
echo "  4. Run:  cd ~/transit && bash infra/init-ssl.sh"
echo "  5. Run:  cd ~/transit && bash infra/deploy.sh"
