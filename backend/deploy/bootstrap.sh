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
#   1. Installs Python 3.11, nginx, certbot, git, AWS CLI
#   2. Clones (or updates) the repo
#   3. Creates a venv and installs requirements
#   4. Installs SSM env fetcher, the app systemd service, and nginx config
#   5. Starts services if SSM parameters/IAM are ready
#   6. Prints next steps (SSM parameters + certbot)
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
sudo dnf install -y python3.11 nginx certbot python3-certbot-nginx git awscli-2

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
chmod +x "${BACKEND_DIR}/deploy/fetch-env.sh"
sudo cp "${BACKEND_DIR}/deploy/stock-market.service" /etc/systemd/system/stock-market.service
sudo cp "${BACKEND_DIR}/deploy/stock-market-env.service" /etc/systemd/system/stock-market-env.service
sudo systemctl daemon-reload
sudo systemctl enable stock-market-env
sudo systemctl enable stock-market

echo "==> Installing nginx config"
sudo cp "${BACKEND_DIR}/deploy/nginx.conf" /etc/nginx/conf.d/api.conf
sudo nginx -t
sudo systemctl enable nginx

echo "==> Starting services"
if sudo systemctl start stock-market-env; then
  sudo systemctl restart stock-market
else
  echo "    !! Could not fetch env from SSM Parameter Store."
  echo "       Ensure the EC2 IAM role can read /stock-market/prod/* and parameters exist."
  echo "       Then run: sudo systemctl restart stock-market"
fi
sudo systemctl restart nginx

cat <<EOF

==============================================================
Bootstrap complete.

Remaining manual steps:

1) Create production environment variables in SSM Parameter Store:

   /stock-market/prod/FINNHUB_API_KEY        SecureString
   /stock-market/prod/GEMINI_API_KEY         SecureString
   /stock-market/prod/FRONTEND_URL           String
   /stock-market/prod/GEMINI_CHAT_MODEL      String
   /stock-market/prod/GEMINI_CHAT_RATE_LIMIT String

   Then refresh the server env:
   sudo systemctl restart stock-market-env
   sudo systemctl restart stock-market

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
