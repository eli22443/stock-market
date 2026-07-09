# Getting Started

Local development setup for the Stock Market portfolio app.

## Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **Supabase** project (database + auth)
- **Finnhub API key** ([finnhub.io](https://finnhub.io/) — free tier)
- Yahoo Finance — no key required (used via `yahoo-finance2`)

## Project structure

```
stock-market/
├── frontend/          # Next.js app
├── backend/           # FastAPI WebSocket + AI API
├── docs/              # Documentation and load tests
└── ENVIRONMENT_VARIABLES.md
```

## Backend setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # if present; otherwise create .env
python main.py
```

Backend runs at [http://localhost:8000](http://localhost:8000).

- Dashboard: [http://localhost:8000/](http://localhost:8000/)
- Health: [http://localhost:8000/health](http://localhost:8000/health)
- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- WebSocket: `ws://localhost:8000/ws`

**Backend `.env` (minimum):**

```env
FINNHUB_API_KEY=your_finnhub_key
GEMINI_API_KEY=your_gemini_key
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local   # if present; otherwise create .env.local
npm run dev
```

Frontend runs at [http://localhost:3000](http://localhost:3000).

**Frontend `.env.local` (minimum):**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
BACKEND_URL=http://127.0.0.1:8000
NEXT_URL=http://localhost:3000
```

See [ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md) for the full list.

## Run both services

1. Start backend: `cd backend && python main.py`
2. Start frontend: `cd frontend && npm run dev`
3. Open [http://localhost:3000](http://localhost:3000)

## Production URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://stock-market-seven-delta.app |
| Backend API | https://api.stock-market-seven-delta.app |
| API docs (Swagger) | https://api.stock-market-seven-delta.app/docs |
| WebSocket | wss://api.stock-market-seven-delta.app/ws |

## Testing

**Frontend production build:**

```bash
cd frontend
npm run build
npm start
```

**Backend health check:**

```bash
curl http://localhost:8000/health
```

**Load test (production):**

```bash
k6 run docs/load-tests/health-test.js
```

See [PERFORMANCE.md](PERFORMANCE.md) for benchmark results.

## Deployment

- **Frontend:** Vercel — set root directory to `frontend`, add env vars from `ENVIRONMENT_VARIABLES.md`
- **Backend:** AWS EC2 — see [backend/deploy/README.md](../backend/deploy/README.md)

## API reference

### Frontend API routes (Next.js)

| Route | Description |
|-------|-------------|
| `GET /api` | Stock list |
| `GET /api/stocks?category=...` | Stocks by category |
| `GET /api/quote?symbol=...` | Stock quote |
| `GET /api/news` | Market news |
| `GET /api/world-indices` | World indices |
| `GET /api/candles?symbol=...` | Price history |
| `GET/POST /api/watchlists` | Watchlist CRUD |
| `GET/POST /api/portfolios` | Portfolio CRUD |
| `GET/POST /api/alerts` | Alert CRUD |
| `POST /api/ai/chat` | AI assistant proxy (auth required) |

### Backend API routes (FastAPI)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Standalone API dashboard UI |
| `GET` | `/health` | Health and dependency status |
| `GET` | `/metrics` | Runtime counters and latency |
| `GET` | `/activity` | Recent activity log |
| `POST` | `/ai/chat` | Gemini chat (IP rate-limited) |
| `GET` | `/docs` | Swagger / OpenAPI UI |
| `WS` | `/ws` | Real-time price streaming |
