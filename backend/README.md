# Stock Market WebSocket Backend

Python FastAPI server that connects to Finnhub WebSocket API and broadcasts real-time stock data to Next.js clients.

## Features

- ✅ Real-time stock price updates via Finnhub WebSocket
- ✅ Multiple client support (one Finnhub connection, many Next.js clients)
- ✅ Efficient subscription management (only subscribe once per symbol)
- ✅ Automatic reconnection handling
- ✅ CORS configured for Next.js frontend

## Setup Instructions

### 1. Install Python Dependencies

Make sure you have Python 3.11+ installed, then:

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Finnhub API key:

```env
FINNHUB_API_KEY=your_actual_finnhub_api_key_here
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000
```

**Get your Finnhub API key:**

1. Go to [https://finnhub.io/](https://finnhub.io/)
2. Sign up for a free account
3. Get your API key from the dashboard

### 3. Run the Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start on `http://localhost:8000`

### 4. Test the Server

Open your browser and visit:

- `http://localhost:8000/` - Health check
- `http://localhost:8000/health` - Detailed health status
- `http://localhost:8000/docs` - FastAPI automatic API documentation

## API Endpoints

### WebSocketz Endpoint

**URL:** `ws://localhost:8000/ws`

#### Client → Server Messages

**Subscribe to symbols:**

```json
{
  "action": "subscribe",
  "symbols": ["AAPL", "NVDA", "MSFT"]
}
```

**Unsubscribe from symbols:**

```json
{
  "action": "unsubscribe",
  "symbols": ["AAPL"]
}
```

#### Server → Client Messages

**Connection confirmation:**

```json
{
  "type": "connection",
  "status": "connected",
  "client_id": "uuid-here"
}
```

**Price update:**

```json
{
  "type": "price_update",
  "symbol": "AAPL",
  "data": {
    "price": 150.25,
    "volume": 1234567,
    "timestamp": 1234567890
  }
}
```

**Subscription confirmation:**

```json
{
  "type": "subscription",
  "status": "subscribed",
  "symbols": ["AAPL", "NVDA"]
}
```

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── websocket_manager.py    # Finnhub WebSocket connection handler
├── client_manager.py       # Next.js client connection manager
├── subscription_manager.py # Subscription logic and routing
├── deploy/                 # AWS EC2 production configs
│   ├── bootstrap.sh         # One-time EC2 provisioning (swap, packages, agent, systemd, nginx)
│   ├── cloudwatch-agent.json
│   ├── cloudwatch-alarms.sh
│   ├── fetch-env.sh
│   ├── iam/                 # GitHub OIDC + EC2 IAM policy templates
│   ├── nginx.conf
│   ├── stock-market-env.service
│   ├── stock-market.service
│   └── README.md
├── requirements.txt        # Python dependencies
└── README.md               # This file
```

## How It Works

1. **Server Startup**: Connects to Finnhub WebSocket on startup
2. **Client Connection**: Next.js clients connect via WebSocket
3. **Subscription**: Clients send subscribe messages with symbols
4. **Efficient Management**: Server only subscribes to Finnhub once per unique symbol
5. **Broadcasting**: When Finnhub sends price updates, server broadcasts to all subscribed clients
6. **Cleanup**: When clients disconnect, server unsubscribes if no other clients need those symbols

## Troubleshooting

### Connection Issues

- **"FINNHUB_API_KEY not found"**: Make sure your `.env` file exists and contains `FINNHUB_API_KEY`
- **"Failed to connect to Finnhub"**: Check your API key is valid and you have internet connection
- **CORS errors**: Make sure `FRONTEND_URL` in `.env` matches your Next.js URL

### WebSocket Issues

- **Connection drops**: Server automatically attempts to reconnect with exponential backoff
- **No updates received**: Check that you've subscribed to symbols and Finnhub is sending data
- **Multiple subscriptions**: Server handles this efficiently - only one Finnhub subscription per symbol

## Next Steps

After setting up the backend:

1. Update your Next.js frontend to connect to this WebSocket server
2. Create a React hook to manage WebSocket connections
3. Update your components to use real-time data

## Development

To run in development mode with auto-reload:

```bash
uvicorn main:app --reload
```

The `--reload` flag automatically restarts the server when you make code changes.

---

## 🚀 Deployment

### Production Deployment

**Status:** ✅ **Deployed to AWS EC2** (`eu-north-1`)


|           |                                                   |
| --------- | ------------------------------------------------- |
| API       | `https://api.stock-market-seven-delta.app`        |
| WebSocket | `wss://api.stock-market-seven-delta.app/ws`       |
| Health    | `https://api.stock-market-seven-delta.app/health` |
| Docs      | `https://api.stock-market-seven-delta.app/docs`   |


**Stack:** EC2 (`t3.micro`) → nginx → uvicorn (`127.0.0.1:8000`) → Let's Encrypt SSL → CloudWatch (metrics + nginx logs + SNS alarms)

Deployment configs live in `[deploy/](deploy/)`:

- `[deploy/README.md](deploy/README.md)` — production runbook (SSH, SSM, CI/CD, CloudWatch, security)
- `[deploy/bootstrap.sh](deploy/bootstrap.sh)` — one-shot EC2 provisioning (swap, packages, agent, systemd, nginx)
- `[deploy/fetch-env.sh](deploy/fetch-env.sh)` — fetches production env from SSM Parameter Store
- `[deploy/cloudwatch-agent.json](deploy/cloudwatch-agent.json)` — CloudWatch metrics + nginx log shipping
- `[deploy/cloudwatch-alarms.sh](deploy/cloudwatch-alarms.sh)` — SNS topic + CloudWatch alarms
- `[deploy/iam/](deploy/iam/)` — GitHub OIDC + SSM deployment IAM templates
- `[deploy/nginx.conf](deploy/nginx.conf)` — reverse proxy + WebSocket upgrade
- `[deploy/stock-market-env.service](deploy/stock-market-env.service)` — systemd oneshot that writes `.env`
- `[deploy/stock-market.service](deploy/stock-market.service)` — systemd unit

CI/CD is handled by `[.github/workflows/deploy-backend.yml](../.github/workflows/deploy-backend.yml)`: GitHub Actions assumes an AWS role via OIDC (`AWS_DEPLOY_ROLE_ARN`), then deploys through SSM Run Command to the instance (`EC2_INSTANCE_ID` in `AWS_REGION`). See `[deploy/iam/README.md](deploy/iam/README.md)` for one-time IAM setup.

Manual deploy (SSH fallback): see `[deploy/README.md](deploy/README.md)`.

**SSH:** `ssh -i ~/.ssh/stock-market-key.pem ec2-user@api.stock-market-seven-delta.app`

### Production environment (`backend/.env` on EC2)

Production `.env` is generated from AWS SSM Parameter Store by `[deploy/fetch-env.sh](deploy/fetch-env.sh)`. Do not edit it manually except for emergency rollback.

```env
FINNHUB_API_KEY=your_finnhub_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=https://stock-market-seven-delta.app
HOST=127.0.0.1
PORT=8000
```

Use `127.0.0.1` in production — nginx is the only public entry point.

### Live logs (EC2)

```bash
sudo journalctl -u stock-market -f
```

See `[deploy/README.md](deploy/README.md)` for SSH, **sync to EC2**, setup, and logs.

### Local development

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📝 Environment Variables

### Required

- `FINNHUB_API_KEY` - Finnhub API key for WebSocket connection
- `FRONTEND_URL` - Frontend URL for CORS (production: `https://stock-market-seven-delta.app`)
- `GEMINI_API_KEY` - Enables `POST /ai/chat`

### Production (EC2)

- `HOST` - `127.0.0.1` (behind nginx)
- `PORT` - `8000`

### Development

- `HOST` - `0.0.0.0`
- `PORT` - `8000`

### Optional

- `SUPABASE_URL` - Supabase URL (if implementing user filtering)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (if implementing user filtering)
- `GEMINI_CHAT_MODEL`, `GEMINI_CHAT_RATE_LIMIT`, etc. — see `[ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md)`

---

## 🔗 Related Documentation

- [Frontend README](../frontend/README.md)
- [Environment Variables](../ENVIRONMENT_VARIABLES.md)

---

