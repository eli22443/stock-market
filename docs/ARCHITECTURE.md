# Architecture

## System overview

```
┌─────────────────────────────────────────────────────────┐
│                    Application Stack                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (Next.js 16)                                  │
│  └─ Vercel → stock-market-seven-delta.app               │
│     - TypeScript, React 19                              │
│     - Tailwind CSS, Shadcn UI                           │
│     - Real-time WebSocket client                        │
│                                                         │
│  Backend (Python FastAPI)                               │
│  └─ AWS EC2 (eu-north-1, t3.micro) + nginx + Let's Encrypt
│     - api.stock-market-seven-delta.app                  │
│     - SSM secrets, GitHub OIDC deploy, CloudWatch       │
│     - WebSocket server for real-time data               │
│     - Finnhub WebSocket integration                     │
│                                                         │
│  Database (Supabase)                                    │
│  └─ PostgreSQL                                          │
│     - User authentication                               │
│     - Watchlists, Portfolios, Alerts                    │
│     - Row Level Security (RLS)                          │
│                                                         │
│  External APIs                                          │
│  ├─ Yahoo Finance API (stock data)                      │
│  └─ Finnhub API (real-time WebSocket)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Request flows

### Authentication and user data

```
Browser
  → Next.js middleware (JWT session / Bearer token)
  → Next.js API routes (/api/portfolios, /api/watchlists, /api/alerts)
  → Supabase client (server-side)
  → PostgreSQL with RLS (auth.uid() = user_id)
```

- **Supabase Auth** issues JWT access tokens (email/password + Google OAuth).
- **Protected pages** (`/dashboard`, `/portfolio`, `/watchlist`, `/assistant`) require a valid session.
- **Protected API routes** validate the user via `supabase.auth.getUser()` before querying data.
- **RLS policies** enforce per-user isolation at the database layer on 7 tables: `profiles`, `watchlists`, `watchlist_items`, `portfolios`, `holdings`, `alerts`, `user_preferences`.

### Real-time market data

```
Browser
  → WebSocket (wss://api.../ws)
  → FastAPI WebSocket handler
  → Finnhub WebSocket (single upstream connection)
  → Fan-out price updates to subscribed clients
```

- Subscriptions are **symbol-based**, not user-based.
- The FastAPI `/ws` endpoint is **not JWT-gated**; it streams public market ticks.
- Yahoo Finance data (quotes, news, candles) is fetched via **Next.js API routes** — no Finnhub key required for historical/static data.

### AI assistant

```
Browser (authenticated)
  → POST /api/ai/chat (Next.js — session required)
  → POST /ai/chat (FastAPI — IP rate-limited)
  → Gemini API
```

The frontend proxy does not forward JWT to FastAPI; AI chat on the backend is protected by per-IP rate limiting and input/output moderation.

## Trust boundaries

| Layer | Auth mechanism | User data |
|-------|----------------|-----------|
| Next.js pages | Supabase session (cookies) | Yes |
| Next.js `/api/portfolios`, `/api/watchlists`, `/api/alerts` | JWT validation | Yes |
| FastAPI `/ws` | None (public market stream) | No |
| FastAPI `/ai/chat` | IP rate limit | No user DB access |
| FastAPI `/health`, `/metrics` | None | No |

## Deployment topology

| Component | Host | CI/CD |
|-----------|------|-------|
| Frontend | Vercel | Vercel Git integration |
| Backend | AWS EC2 + Nginx + TLS | GitHub Actions → OIDC → SSM Run Command |
| Database | Supabase (managed PostgreSQL) | Manual migrations |
| Secrets (prod backend) | AWS SSM Parameter Store | Fetched at boot/deploy |

## Monorepo layout

This repository is a **single monorepo** with two deployable surfaces:

- `frontend/` — portfolio app (Vercel)
- `backend/` — real-time API + ops dashboard (EC2)

They share production domain family (`stock-market-seven-delta.app` / `api.stock-market-seven-delta.app`) but deploy independently.

## Security

- Row Level Security (RLS) on all user-data Postgres tables
- Secrets in environment variables (SSM Parameter Store in production)
- Protected Next.js API routes with Supabase session validation
- WSS (TLS) for WebSocket in production
- GitHub Actions OIDC — no long-lived AWS keys in CI

## Related docs

- [Getting Started](GETTING_STARTED.md)
- [Performance & Load Testing](PERFORMANCE.md)
- [Backend Deploy Guide](../backend/deploy/README.md)
- [Environment Variables](../ENVIRONMENT_VARIABLES.md)
