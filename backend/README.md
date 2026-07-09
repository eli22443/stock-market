# Stock Market WebSocket Backend

Python FastAPI server that connects to Finnhub WebSocket API and broadcasts real-time stock data to WebSocket clients. Powers the [full-stack portfolio app](../README.md) (Next.js on Vercel) with live prices, ops dashboard, and Gemini AI chat.

**Live:** https://api.stock-market-seven-delta.app · **Docs:** https://api.stock-market-seven-delta.app/docs

## Related docs

- [Project overview](../README.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [Performance & load testing](../docs/PERFORMANCE.md)
- [Getting started](../docs/GETTING_STARTED.md)
- [AWS deploy runbook](deploy/README.md)

## Features

- Real-time stock price updates via Finnhub WebSocket
- Multiple client support (one Finnhub connection, many WebSocket clients)
- Efficient subscription management (only subscribe once per symbol)
- Automatic reconnection with exponential backoff
- AI chat via Gemini (`POST /ai/chat`)
- API platform dashboard at `/` (no frontend required)
- Runtime metrics and health endpoints

## Setup

### 1. Install dependencies

Requires Python 3.11+.

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure environment

Create a `.env` file in the `backend` directory:

```env
FINNHUB_API_KEY=your_finnhub_api_key
GEMINI_API_KEY=your_gemini_api_key
HOST=0.0.0.0
PORT=8000
```

Get your Finnhub API key at [finnhub.io](https://finnhub.io/) (free tier available).

### 3. Run the server

**Development** (auto-reload, all interfaces):

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Or:

```bash
python main.py
```

Open `http://localhost:8000/` to access the dashboard.

## Running in production

**This project** runs on **AWS EC2** (`t3.micro`, `eu-north-1`) behind Nginx with TLS, GitHub Actions OIDC deploy, SSM secrets, and CloudWatch — see [deploy/README.md](deploy/README.md).

The backend is a standard **ASGI** app; you can also run uvicorn on other hosts (VPS, Docker, PaaS):

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1 --no-access-log
```

| Pattern | `HOST` | Notes |
|---------|--------|-------|
| Direct exposure (PaaS, Docker) | `0.0.0.0` | Platform handles TLS |
| Behind reverse proxy (nginx, Caddy, Traefik) | `127.0.0.1` | Proxy terminates TLS and forwards to uvicorn |

Optional env vars for the dashboard **Deployment** panel:

| Variable | Example | Purpose |
|----------|---------|---------|
| `DEPLOYMENT_ENV` | `production` | Shown in health/deployment info |
| `REGION` | `eu-north-1` | Optional label (any cloud or datacenter) |

Health check: `GET /health` · Metrics: `GET /metrics` · Activity: `GET /activity`

**Performance (production):** ~20 ms REST avg under light load; k6 load test at 100 VUs (~263 req/s, p95 ~85 ms) — [details](../docs/PERFORMANCE.md). Reproduce: `k6 run docs/load-tests/health-test.js` from repo root.

## Dashboard

The root URL (`/`) serves a standalone HTML dashboard with:

- **Live Stock Streaming** — subscribe form, live price table with per-row remove, auto-reconnect WebSocket
- **AI Assistant** — chat UI wired to `POST /ai/chat`
- **Health Status** — polls `GET /health`
- **Backend Monitoring** — polls `GET /metrics` (CPU, memory, message counters, latency)
- **Recent Activity** — polls `GET /activity` (HTTP, WebSocket, AI events)
- **Deployment** — runtime environment info in health panel
- **Architecture** — static system diagram
- **API Documentation** — link to Swagger at `/docs`

Static assets live in [`static/`](static/).

## API Endpoints

### HTTP

| Method | Path       | Description                      |
|--------|------------|----------------------------------|
| `GET`  | `/`        | Dashboard UI                     |
| `GET`  | `/health`  | Health and dependency status     |
| `GET`  | `/metrics` | Runtime counters, latency, and system stats |
| `GET`  | `/activity` | Recent backend events (activity log) |
| `POST` | `/ai/chat` | Gemini chat completion           |
| `GET`  | `/docs`    | Swagger UI (OpenAPI)             |

### WebSocket

**Local:** `ws://localhost:8000/ws`  
**Production:** `wss://api.stock-market-seven-delta.app/ws`

#### Client → Server

Subscribe:

```json
{ "action": "subscribe", "symbols": ["AAPL", "NVDA", "MSFT"] }
```

Unsubscribe:

```json
{ "action": "unsubscribe", "symbols": ["AAPL"] }
```

#### Server → Client

Connection confirmation:

```json
{ "type": "connection", "status": "connected", "client_id": "uuid-here" }
```

Price update:

```json
{
  "type": "price_update",
  "symbol": "AAPL",
  "data": { "price": 150.25, "volume": 1234567, "timestamp": 1234567890 }
}
```

Subscription confirmation:

```json
{ "type": "subscription", "status": "subscribed", "symbols": ["AAPL", "NVDA"] }
```

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── metrics.py              # Runtime counters, latency, and system stats
├── activity_log.py         # In-memory recent activity ring buffer
├── ai_provider.py          # Gemini API provider
├── chat_service.py         # Chat orchestration and moderation
├── websocket_manager.py    # Finnhub WebSocket connection handler
├── client_manager.py       # WebSocket client connection manager
├── subscription_manager.py # Subscription logic and routing
├── static/                 # Dashboard HTML/CSS/JS
│   ├── index.html
│   ├── dashboard.css
│   └── dashboard.js
├── deploy/                 # AWS EC2 production configs (see deploy/README.md)
│   ├── README.md            # AWS production runbook
│   ├── bootstrap.sh         # One-time EC2 provisioning
│   ├── fetch-env.sh         # Fetches env from SSM Parameter Store
│   ├── nginx.conf           # Reverse proxy + WebSocket upgrade
│   ├── stock-market.service # systemd unit
│   ├── stock-market-env.service
│   ├── cloudwatch-agent.json
│   ├── cloudwatch-alarms.sh
│   └── iam/                 # GitHub OIDC + EC2 IAM templates
├── requirements.txt
└── README.md
```

## How It Works

1. **Startup** — connects to Finnhub WebSocket
2. **Client connects** — browser or app opens `ws://host/ws`
3. **Subscribe** — client sends symbol list; server subscribes to Finnhub once per unique symbol
4. **Broadcast** — Finnhub price updates are forwarded to all subscribed clients
5. **Cleanup** — on disconnect, server unsubscribes symbols no other client needs

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `FINNHUB_API_KEY` | Finnhub API key for WebSocket data |
| `GEMINI_API_KEY` | Gemini API key for `POST /ai/chat` |

### Server

| Variable | Typical local | Typical production |
|----------|---------------|-------------------|
| `HOST` | `0.0.0.0` | `0.0.0.0` (direct) or `127.0.0.1` (behind reverse proxy) |
| `PORT` | `8000` | `8000` (or platform-assigned) |
| `DEPLOYMENT_ENV` | `development` | `production` |
| `REGION` | — | Optional region label for dashboard (any provider) |

### Optional (AI tuning)

| Variable | Description |
|----------|-------------|
| `GEMINI_CHAT_MODEL` | Model name (default: `gemini-3.1-flash-lite`) |
| `GEMINI_CHAT_RATE_LIMIT` | Max requests per window (default: `30`) |
| `GEMINI_CHAT_RATE_WINDOW_SECONDS` | Rate limit window (default: `60`) |
| `GEMINI_CHAT_COMPLETION_MAX_RETRIES` | Retry count on transient errors (default: `4`) |
| `GEMINI_CHAT_MODERATION` | Enable input/output moderation (default: `1`) |

See [`ENVIRONMENT_VARIABLES.md`](../ENVIRONMENT_VARIABLES.md) for the full list including frontend variables.

## Troubleshooting

- **"FINNHUB_API_KEY not found"** — `.env` is missing or doesn't contain `FINNHUB_API_KEY`
- **"Failed to connect to Finnhub"** — check API key validity and internet connection
- **Connection drops** — server reconnects automatically with exponential backoff
- **No price updates** — verify you've subscribed to symbols and the market is open
- **AI chat returns 503** — `GEMINI_API_KEY` is not set

## AWS deployment

Production setup under [`deploy/`](deploy/): EC2 provisioning, Nginx, SSM Parameter Store, GitHub Actions OIDC CI/CD, CloudWatch alarms.

| Service   | URL (this project's live instance)              |
|-----------|--------------------------------------------------|
| Dashboard | `https://api.stock-market-seven-delta.app`       |
| WebSocket | `wss://api.stock-market-seven-delta.app/ws`      |
| Health    | `https://api.stock-market-seven-delta.app/health` |
| Docs      | `https://api.stock-market-seven-delta.app/docs`  |

See [`deploy/README.md`](deploy/README.md) for EC2 provisioning, nginx, SSM secrets, CI/CD, and CloudWatch.
