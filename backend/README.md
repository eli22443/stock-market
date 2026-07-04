# Stock Market WebSocket Backend

Python FastAPI server that connects to Finnhub WebSocket API and broadcasts real-time stock data to WebSocket clients.

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

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000/` to access the dashboard.

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

**URL:** `ws://localhost:8000/ws`

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
├── deploy/                 # AWS EC2 production configs
│   ├── README.md            # Production runbook
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

| Variable | Dev | Production (EC2) |
|----------|-----|------------------|
| `HOST` | `0.0.0.0` | `127.0.0.1` (behind nginx) |
| `PORT` | `8000` | `8000` |

### Optional

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

## Deployment

Deployed to **AWS EC2** (`t3.micro`, `eu-north-1`).

| Service   | URL                                              |
|-----------|--------------------------------------------------|
| Dashboard | `https://api.stock-market-seven-delta.app`       |
| WebSocket | `wss://api.stock-market-seven-delta.app/ws`      |
| Health    | `https://api.stock-market-seven-delta.app/health` |
| Docs      | `https://api.stock-market-seven-delta.app/docs`  |

**Stack:** EC2 → nginx (TLS via Let's Encrypt) → uvicorn (`127.0.0.1:8000`) → CloudWatch (metrics + logs + SNS alarms)

Production `.env` is generated from SSM Parameter Store by [`deploy/fetch-env.sh`](deploy/fetch-env.sh). CI/CD runs via GitHub Actions + OIDC + SSM Run Command (no SSH keys in GitHub).

See [`deploy/README.md`](deploy/README.md) for the full production runbook: SSH access, setup, CI/CD, CloudWatch, and security.
