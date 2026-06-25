#!/usr/bin/env bash
#
# bootstrap.sh — provision the Stock Market backend on a fresh Amazon Linux 2023 EC2 instance.
#
# Usage (on the EC2 instance, as ec2-user):
#   chmod +x bootstrap.sh
#   ./bootstrap.sh
#
# Can also be pasted into EC2 "User data" at launch (runs as root; adjust HOME below).
#
# What it does:
#   1. Installs Python 3.11, nginx, certbot, git
#   2. Clones (or updates) the repo
#   3. Creates a venv and installs requirements
#   4. Installs the systemd service and nginx config from deploy/
#   5. Starts services
#   6. Prints next steps (.env + certbot)
#
# It is idempotent — safe to re-run.

set -euo pipefail

# ---- Config (override via environment) ----
REPO_URL="${REPO_URL:-https://github.com/eli22443/stock-market.git}"
DOMAIN="${DOMAIN:-api.stock-market-seven-delta.app}"
APP_USER="${APP_USER:-ec2-user}"
APP_HOME="${APP_HOME:-/home/${APP_USER}}"
REPO_DIR="${APP_HOME}/stock-market"
BACKEND_DIR="${REPO_DIR}/backend"
VENV_DIR="${BACKEND_DIR}/venv"

echo "==> Installing system packages"
sudo dnf update -y
sudo dnf install -y python3.11 nginx certbot python3-certbot-nginx git

echo "==> Cloning / updating repo"
if [ -d "${REPO_DIR}/.git" ]; then
  git -C "${REPO_DIR}" pull
else
  git clone "${REPO_URL}" "${REPO_DIR}"
fi

echo "==> Creating virtualenv and installing dependencies"
if [ ! -d "${VENV_DIR}" ]; then
  python3.11 -m venv "${VENV_DIR}"
fi
"${VENV_DIR}/bin/pip" install --upgrade pip
"${VENV_DIR}/bin/pip" install -r "${BACKEND_DIR}/requirements.txt"

echo "==> Installing systemd service"
sudo cp "${BACKEND_DIR}/deploy/stock-market.service" /etc/systemd/system/stock-market.service
sudo systemctl daemon-reload
sudo systemctl enable stock-market

echo "==> Installing nginx config"
sudo cp "${BACKEND_DIR}/deploy/nginx.conf" /etc/nginx/conf.d/api.conf
sudo nginx -t
sudo systemctl enable nginx

echo "==> Starting services"
if [ -f "${BACKEND_DIR}/.env" ]; then
  sudo systemctl restart stock-market
else
  echo "    !! ${BACKEND_DIR}/.env not found — backend will fail to start until it exists."
  echo "       Create it (see below), then: sudo systemctl restart stock-market"
fi
sudo systemctl restart nginx

cat <<EOF

==============================================================
Bootstrap complete.

Remaining manual steps:

1) Create the backend environment file (never commit this):
   nano ${BACKEND_DIR}/.env

   FINNHUB_API_KEY=...
   GEMINI_API_KEY=...
   FRONTEND_URL=https://stock-market-seven-delta.app
   HOST=127.0.0.1
   PORT=8000

   Then: sudo systemctl restart stock-market

2) Ensure DNS A record points to this instance's Elastic IP:
   ${DOMAIN} -> <Elastic IP>

3) Obtain the TLS certificate (after DNS propagates):
   sudo certbot --nginx -d ${DOMAIN}

4) Verify:
   curl https://${DOMAIN}/health
   sudo systemctl status stock-market
   sudo journalctl -u stock-market -f
==============================================================
EOF
