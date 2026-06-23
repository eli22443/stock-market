# AWS EC2 Deployment (Production)

Backend runs on **EC2** in `eu-north-1` behind **nginx** with **Let's Encrypt** TLS.

## Connect to EC2

```bash
ssh -i ~/.ssh/stock-market-key.pem ec2-user@api.stock-market-seven-delta.app
```

Region: `eu-north-1` · User: `ec2-user` (Amazon Linux). Elastic IP is set in AWS Console (DNS `api` A record points to it).

## Production URLs

| Service | URL |
|---------|-----|
| API | `https://api.stock-market-seven-delta.app` |
| WebSocket | `wss://api.stock-market-seven-delta.app/ws` |
| Health | `https://api.stock-market-seven-delta.app/health` |
| Frontend | `https://stock-market-seven-delta.app` (Vercel) |

## Architecture

```text
Browser → Vercel (Next.js)
Browser → wss://api.stock-market-seven-delta.app/ws → nginx :443 → uvicorn 127.0.0.1:8000 → Finnhub
```

## Server requirements

- Amazon Linux 2023
- Python 3.11+
- `t3.small` (or `t3.micro` for low traffic)
- Elastic IP attached
- Security group: **22**, **80**, **443** only (do not expose port 8000)

## Initial setup (EC2)

```bash
# System packages
sudo dnf update -y
sudo dnf install python3.11 nginx certbot python3-certbot-nginx git -y

# App
cd ~
git clone https://github.com/YOUR_USER/stock-market.git
cd stock-market/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Environment (create .env with secrets — never commit)
cp .env.example .env   # if example exists, else create manually
# Set FRONTEND_URL=https://stock-market-seven-delta.app

# systemd
sudo cp deploy/stock-market.service /etc/systemd/system/stock-market.service
sudo systemctl daemon-reload
sudo systemctl enable --now stock-market

# nginx
sudo cp deploy/nginx.conf /etc/nginx/conf.d/api.conf
sudo nginx -t && sudo systemctl enable --now nginx

# DNS: api.stock-market-seven-delta.app → your Elastic IP (A record, see AWS Console)
# SSL (after DNS propagates)
sudo certbot --nginx -d api.stock-market-seven-delta.app
```

## Deploy updates

```bash
cd ~/stock-market
git pull
source backend/venv/bin/activate
pip install -r backend/requirements.txt
sudo systemctl restart stock-market
```

## Verify

```bash
curl https://api.stock-market-seven-delta.app/health
sudo systemctl status stock-market
```

## Live logs

Watch backend output in real time (WebSocket connects, Finnhub, errors, restarts):

```bash
sudo journalctl -u stock-market -f
```

Press `Ctrl+C` to stop following.

Other useful commands:

```bash
# Last 100 lines
sudo journalctl -u stock-market -n 100

# Logs since last boot
sudo journalctl -u stock-market -b

# Logs from the last hour
sudo journalctl -u stock-market --since "1 hour ago"
```

Logs come from uvicorn stdout/stderr via systemd. Use this after deploys or when debugging WebSocket issues.

## Vercel environment variables

```env
NEXT_PUBLIC_WS_URL=wss://api.stock-market-seven-delta.app/ws
BACKEND_URL=https://api.stock-market-seven-delta.app
NEXT_URL=https://stock-market-seven-delta.app
```

## EC2 environment variables (`backend/.env`)

```env
FINNHUB_API_KEY=...
GEMINI_API_KEY=...
FRONTEND_URL=https://stock-market-seven-delta.app
HOST=127.0.0.1
PORT=8000
```
