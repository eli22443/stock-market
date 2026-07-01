# AWS EC2 Deployment (Production)

Backend runs on **EC2** (`t3.micro`, `eu-north-1`) behind **nginx** with **Let's Encrypt** TLS. Full stack is live: SSM secrets, GitHub OIDC CI/CD, CloudWatch metrics/logs/alarms.

## Current infrastructure (live)

| Layer | Implementation |
|-------|----------------|
| Compute | EC2 Amazon Linux 2023, `t3.micro`, Elastic IP, 2 GB swap |
| TLS / proxy | nginx :443, Certbot; uvicorn on `127.0.0.1:8000` only |
| App service | `stock-market.service` — `python -u -m uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1`, `Restart=always` |
| Secrets | SSM Parameter Store `/stock-market/prod/*` → `fetch-env.sh` → `backend/.env` (via `stock-market-env.service`) |
| Deploy | GitHub Actions → OIDC → SSM Run Command (no SSH, no AWS keys in GitHub) |
| IAM | EC2 role: `AmazonSSMManagedInstanceCore`, `CloudWatchAgentServerPolicy`, SSM read; GitHub role: OIDC trust on `master` |
| Monitoring | CloudWatch agent → `StockMarket/Backend` metrics + `/stock-market/nginx` logs; SNS alarms (email confirmed) |
| Security | SG 22/80/443 only; no secrets in git; least-privilege IAM |

Deploy scripts in this directory: `bootstrap.sh`, `fetch-env.sh`, `cloudwatch-agent.json`, `cloudwatch-alarms.sh`. Shell scripts use **LF line endings** (`.gitattributes`: `*.sh text eol=lf`).

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
- **`t3.micro`** (current production; 2 GB swap configured in `bootstrap.sh`)
- Elastic IP attached
- Security group: **22**, **80**, **443** only (do not expose port 8000)

## Initial setup (EC2)

### Option A — automated ([`bootstrap.sh`](bootstrap.sh))

Provisions packages, repo, venv, systemd, and nginx in one run. Idempotent.

```bash
# On the instance, after first SSH in
git clone https://github.com/YOUR_USER/stock-market.git
cd stock-market/backend/deploy
chmod +x bootstrap.sh
REPO_URL=https://github.com/YOUR_USER/stock-market.git ./bootstrap.sh
```

Then finish the manual steps the script prints: create SSM parameters, confirm DNS, and run certbot.

### Option B — manual

```bash
# System packages
sudo dnf update -y
sudo dnf install python3.11 nginx certbot python3-certbot-nginx git awscli-2 -y

# App
cd ~
git clone https://github.com/YOUR_USER/stock-market.git
cd stock-market/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Environment comes from AWS SSM Parameter Store.
# See "SSM Parameter Store environment" below.

# systemd
chmod +x deploy/fetch-env.sh
sudo cp deploy/stock-market-env.service /etc/systemd/system/stock-market-env.service
sudo cp deploy/stock-market.service /etc/systemd/system/stock-market.service
sudo systemctl daemon-reload
sudo systemctl enable --now stock-market-env
sudo systemctl enable --now stock-market

# nginx
sudo cp deploy/nginx.conf /etc/nginx/conf.d/api.conf
sudo nginx -t && sudo systemctl enable --now nginx

# DNS: api.stock-market-seven-delta.app → your Elastic IP (A record, see AWS Console)
# SSL (after DNS propagates)
sudo certbot --nginx -d api.stock-market-seven-delta.app
```

## Deploy updates

### Primary — GitHub Actions (no SSH)

Push to `master` with changes under `backend/**` triggers [`.github/workflows/deploy-backend.yml`](../../.github/workflows/deploy-backend.yml).

Requires GitHub Actions variables: `AWS_DEPLOY_ROLE_ARN`, `AWS_REGION`, `EC2_INSTANCE_ID`. See [`iam/README.md`](iam/README.md).

You can also run the workflow manually via **Actions → Deploy Backend → Run workflow**.

The remote command: `git reset --hard origin/master`, refresh env from SSM, `pip install`, restart services, health check.

### Manual — SSH fallback

```bash
cd ~/stock-market
git pull
source backend/venv/bin/activate
pip install -r backend/requirements.txt
sudo systemctl restart stock-market-env
sudo systemctl restart stock-market
```

## SSM Parameter Store environment

Production environment variables live in AWS SSM Parameter Store under `/stock-market/prod/`.
`fetch-env.sh` downloads all parameters recursively and writes `backend/.env` (mode `600`).
The EC2 instance role must allow `ssm:GetParametersByPath` with decryption for that path.

Examples (add others as needed — `SUPABASE_URL`, `SUPABASE_KEY`, etc.):

Create parameters (replace `$AWS_REGION` with your region, e.g. `eu-north-1`):

```bash
# Secrets
aws ssm put-parameter --region "$AWS_REGION" --name /stock-market/prod/FINNHUB_API_KEY --type SecureString --value "REPLACE_ME"
aws ssm put-parameter --region "$AWS_REGION" --name /stock-market/prod/GEMINI_API_KEY --type SecureString --value "REPLACE_ME"
# Optional backend Supabase vars (if used server-side)
# aws ssm put-parameter --region "$AWS_REGION" --name /stock-market/prod/SUPABASE_URL --type SecureString --value "REPLACE_ME"
# aws ssm put-parameter --region "$AWS_REGION" --name /stock-market/prod/SUPABASE_KEY --type SecureString --value "REPLACE_ME"

# Non-secrets
aws ssm put-parameter --region "$AWS_REGION" --name /stock-market/prod/FRONTEND_URL --type String --value "https://stock-market-seven-delta.app"
aws ssm put-parameter --region "$AWS_REGION" --name /stock-market/prod/GEMINI_CHAT_MODEL --type String --value "gemini-3.1-flash-lite"
aws ssm put-parameter --region "$AWS_REGION" --name /stock-market/prod/GEMINI_CHAT_RATE_LIMIT --type String --value "30"
aws ssm put-parameter --region "$AWS_REGION" --name /stock-market/prod/GEMINI_CHAT_RATE_WINDOW_SECONDS --type String --value "60"
aws ssm put-parameter --region "$AWS_REGION" --name /stock-market/prod/GEMINI_CHAT_COMPLETION_MAX_RETRIES --type String --value "4"
aws ssm put-parameter --region "$AWS_REGION" --name /stock-market/prod/GEMINI_CHAT_MODERATION --type String --value "0"
```

Rotate the current Finnhub and Gemini keys before storing them because they have existed in plaintext locally.

Refresh `.env` on EC2 from SSM:

```bash
sudo systemctl restart stock-market-env
sudo systemctl restart stock-market
```

The generated file is `/home/ec2-user/stock-market/backend/.env` with mode `600`.

## GitHub Actions CI/CD (OIDC + SSM)

Backend deploys can run from GitHub Actions without SSH keys. The workflow uses GitHub OIDC to assume an AWS role, then calls SSM Run Command on the EC2 instance.

Files:

- [`../../.github/workflows/deploy-backend.yml`](../../.github/workflows/deploy-backend.yml) — workflow
- [`iam/`](iam/) — IAM trust and permission policy templates

One-time setup:

1. Create or confirm the GitHub OIDC provider in AWS.
2. Create `github-actions-deploy-role` using [`iam/github-actions-trust.json`](iam/github-actions-trust.json).
3. Attach [`iam/github-actions-permissions.json`](iam/github-actions-permissions.json) to that role.
4. Attach `AmazonSSMManagedInstanceCore` to the EC2 instance role.
5. Attach [`iam/ec2-instance-permissions.json`](iam/ec2-instance-permissions.json) to the EC2 instance role so `fetch-env.sh` can read `/stock-market/prod/*`.
6. In GitHub Actions variables, set these either at repository level or under the `production` environment:
   - `AWS_DEPLOY_ROLE_ARN`
   - `AWS_REGION`
   - `EC2_INSTANCE_ID`

Deploy triggers:

- Push to `master` when files under `backend/**` change
- Manual `workflow_dispatch`

The remote deploy command runs:

```bash
cd /home/ec2-user/stock-market && git fetch origin && git reset --hard origin/master
sudo systemctl restart stock-market-env
pip install -r backend/requirements.txt
sudo systemctl restart stock-market
curl -fsS http://127.0.0.1:8000/health   # retried up to 15 times
```

Optional: [`.github/workflows/test-oidc.yml`](../../.github/workflows/test-oidc.yml) verifies OIDC role assumption and EC2 describe access.

See [`iam/README.md`](iam/README.md) for setup commands.

## Sync repo configs to EC2

After `git pull`, copy nginx and systemd files from the repo to match production. Run on the server (SSH in first).

```bash
ssh -i ~/.ssh/stock-market-key.pem ec2-user@api.stock-market-seven-delta.app

cd ~/stock-market
git pull

# nginx + systemd from repo
chmod +x backend/deploy/fetch-env.sh
sudo cp backend/deploy/stock-market-env.service /etc/systemd/system/stock-market-env.service
sudo cp backend/deploy/nginx.conf /etc/nginx/conf.d/api.conf
sudo cp backend/deploy/stock-market.service /etc/systemd/system/stock-market.service

sudo systemctl daemon-reload
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl restart stock-market-env
sudo systemctl restart stock-market

# SSL — (re)apply cert if nginx was overwritten; safe to re-run if cert already exists
sudo certbot --nginx -d api.stock-market-seven-delta.app

# Verify
curl https://api.stock-market-seven-delta.app/health
sudo systemctl status stock-market
```

**Note:** Copying `nginx.conf` replaces the HTTP-only block. Certbot adds HTTPS and redirect; run `certbot --nginx` after each nginx overwrite so port 443 keeps working.

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

## CloudWatch monitoring (live)

EC2 does not report memory by default — the CloudWatch agent fills that gap on `t3.micro`. Metrics, nginx logs, and SNS alarms are deployed and working.

### Agent

[`bootstrap.sh`](bootstrap.sh) installs `amazon-cloudwatch-agent` and loads [`cloudwatch-agent.json`](cloudwatch-agent.json):

- **Metrics** (namespace `StockMarket/Backend`, by `InstanceId`): `mem_used_percent`, `swap_used_percent`, `disk_used_percent`, CPU.
- **Logs**: `/var/log/nginx/access.log` and `error.log` → `/stock-market/nginx` (14-day retention).
- **App logs**: journald only (`journalctl -u stock-market -f`).

**Important:** the agent runs as **`root`** (`run_as_user` in the config). Amazon Linux protects nginx log files; running as `cwagent` caused `permission denied` on `/var/log/nginx/access.log`.

Refresh agent config on a running instance:

```bash
sudo cp ~/stock-market/backend/deploy/cloudwatch-agent.json \
  /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
```

EC2 instance role needs `CloudWatchAgentServerPolicy` ([`iam/README.md`](iam/README.md)).

### Alarms + SNS

Created with [`cloudwatch-alarms.sh`](cloudwatch-alarms.sh) (run from your workstation):

```bash
AWS_REGION=eu-north-1 \
INSTANCE_ID=i-xxxxxxxxxxxxxxxxx \
ALERT_EMAIL=you@example.com \
./cloudwatch-alarms.sh
```

SNS topic `stock-market-alerts` — **confirm the subscription email** or alarms are silent.

| Alarm | Trigger |
|-------|---------|
| `stock-market-mem-high` | Memory > 85% for 5 min |
| `stock-market-disk-high` | Root disk > 85% |
| `stock-market-cpu-high` | CPU > 80% for 10 min |
| `stock-market-cpu-credits-low` | CPU credit balance < 20 |
| `stock-market-status-check-failed` | EC2 status check failed |

## Security summary

- Backend bound to `127.0.0.1:8000`; public traffic only through nginx (HTTPS).
- Secrets in SSM Parameter Store; none in GitHub.
- IAM roles only — no `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` on EC2 or in GitHub.
- GitHub OIDC with branch-scoped trust (`master`).
- Deploy via SSM Run Command instead of SSH.

## Next planned improvements

- Ship FastAPI / systemd logs to CloudWatch (optional)
- Automatic rollback if deploy health check fails
- Staging environment
- Dockerize backend; ECS/Fargate
- Terraform / CloudFormation
- Auto-resize Lambda on sustained memory pressure (see plan Part 5)

## Vercel environment variables

```env
NEXT_PUBLIC_WS_URL=wss://api.stock-market-seven-delta.app/ws
BACKEND_URL=https://api.stock-market-seven-delta.app
NEXT_URL=https://stock-market-seven-delta.app
```

## EC2 environment variables (`backend/.env`)

Do not edit this manually in production. It is generated from SSM by [`fetch-env.sh`](fetch-env.sh) via `stock-market-env.service`.

```env
FINNHUB_API_KEY=...
GEMINI_API_KEY=...
FRONTEND_URL=https://stock-market-seven-delta.app
HOST=127.0.0.1
PORT=8000
```
