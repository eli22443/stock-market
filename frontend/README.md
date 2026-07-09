# Frontend

Next.js 16 frontend for the [Stock Market portfolio app](../README.md).

**Live:** https://stock-market-seven-delta.app

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Shadcn UI · Chart.js · Supabase Auth · WebSocket client

## Setup

```bash
npm install
cp .env.example .env.local   # create and fill if no example file
npm run dev
```

Open http://localhost:3000. Requires the [backend](../backend/README.md) running for WebSocket prices and AI chat.

**Minimum `.env.local`:**

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
BACKEND_URL=http://127.0.0.1:8000
NEXT_URL=http://localhost:3000
```

See [ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md) for all variables.

## Structure

```
frontend/
├── app/
│   ├── (auth)/          # login, signup
│   ├── (protected)/     # dashboard, portfolio, watchlist, alerts, assistant
│   └── api/             # Next.js API routes (19 handlers)
├── components/
├── context/             # Auth, WebSocket
├── hooks/
└── lib/supabase/        # SSR auth clients
```

## Key routes

| Path | Auth | Description |
|------|------|-------------|
| `/` | Public | Market overview |
| `/stocks`, `/quote/[symbol]` | Public | Stock browse and detail |
| `/news`, `/world-indices` | Public | News and indices |
| `/dashboard`, `/portfolio` | Protected | User dashboard and portfolios |
| `/watchlist`, `/alerts` | Protected | Watchlists and price alerts |
| `/assistant` | Protected | Gemini AI chat |

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # production server
npm run lint     # ESLint
```

## Deployment

Deployed on **Vercel** with root directory `frontend`. Set production env vars per [ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md).

Backend WebSocket: `wss://api.stock-market-seven-delta.app/ws`

## Docs

- [Root README](../README.md) — project overview
- [Getting Started](../docs/GETTING_STARTED.md) — full local setup
- [Architecture](../docs/ARCHITECTURE.md) — auth and data flows
