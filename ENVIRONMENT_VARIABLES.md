# Environment Variables Documentation

This document lists all environment variables used in the Stock Market application.

## Frontend Environment Variables

### Required Variables

#### Supabase Configuration
- **`NEXT_PUBLIC_SUPABASE_URL`**
  - Description: Your Supabase project URL
  - Example: `https://xxxxx.supabase.co`
  - Where to get: Supabase Dashboard → Settings → API → Project URL
  - Public: Yes (used in client-side code)

- **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`**
  - Description: Supabase anon/public key for client-side operations
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Where to get: Supabase Dashboard → Settings → API → anon public key
  - Public: Yes (used in client-side code)

- **`SUPABASE_SERVICE_ROLE_KEY`**
  - Description: Supabase service role key for server-side operations
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Where to get: Supabase Dashboard → Settings → API → service_role secret key
  - Public: No (server-side only, never expose to client)

#### WebSocket Backend URL
- **`NEXT_PUBLIC_WS_URL`**
  - Description: WebSocket URL for real-time stock data backend
  - Development: `ws://localhost:8000/ws`
  - Production: `wss://your-backend.railway.app/ws` (or your backend URL)
  - Public: Yes (used in client-side code)
  - Note: Must use `wss://` (secure WebSocket) in production

### Optional Variables

- **`NEXT_URL`**
  - Description: Base URL for internal API calls
  - Development: `http://localhost:3000`
  - Production: `https://your-app.vercel.app`
  - Public: No (server-side only)

- **`SKIP_YAHOO_FINANCE`**
  - Description: Skip Yahoo Finance API calls (for development when rate limited)
  - Values: `true` or `false`
  - Default: `false`
  - Public: No (server-side only)
  - Note: Remove or set to `false` in production

---

## Backend Environment Variables

### Required Variables

- **`FINNHUB_API_KEY`**
  - Description: Finnhub API key for WebSocket connection
  - Where to get: https://finnhub.io/ → Sign up → Get API key from dashboard
  - Public: No (keep secret)

- **`FRONTEND_URL`**
  - Description: Frontend URL for CORS configuration
  - Development: `http://localhost:3000`
  - Production: `https://your-app.vercel.app`
  - Public: No (server-side only)

- **`HOST`**
  - Description: Server host address
  - Value: `0.0.0.0` (to accept connections from all interfaces)
  - Public: No

- **`PORT`**
  - Description: Server port number
  - Development: `8000`
  - Production: Usually provided by hosting platform (e.g., `$PORT` in Railway)
  - Public: No

### Optional Variables

- **`SUPABASE_URL`**
  - Description: Supabase project URL (if implementing user filtering in backend)
  - Example: `https://xxxxx.supabase.co`
  - Public: No

- **`SUPABASE_SERVICE_ROLE_KEY`**
  - Description: Supabase service role key (if implementing user filtering in backend)
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Public: No

---

## Environment Variable Setup

### Development Setup

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_URL=http://localhost:3000
SKIP_YAHOO_FINANCE=false
```

**Backend (`backend/.env`):**
```env
FINNHUB_API_KEY=your_finnhub_api_key_here
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000
```

### Production Setup

**Frontend (Vercel Dashboard → Settings → Environment Variables):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app/ws
NEXT_URL=https://your-app.vercel.app
```

**Backend (Railway/Render Dashboard → Variables):**
```env
FINNHUB_API_KEY=your_finnhub_api_key_here
HOST=0.0.0.0
PORT=$PORT
FRONTEND_URL=https://your-app.vercel.app
```

---

## Security Notes

1. **Never commit `.env` files to Git** - They are already in `.gitignore`
2. **Use different API keys for development and production**
3. **`NEXT_PUBLIC_*` variables are exposed to the browser** - Don't put secrets in them
4. **Service role keys have admin access** - Keep them secure and server-side only
5. **Rotate API keys regularly** - Especially if exposed or compromised

---

## Variable Naming Convention

- **`NEXT_PUBLIC_*`**: Variables that need to be accessible in client-side code (browser)
- **No prefix**: Server-side only variables (not accessible in browser)

---

## Verification Checklist

Before deployment, verify:

- [ ] All required environment variables are set
- [ ] No secrets are hardcoded in code
- [ ] `.env` files are in `.gitignore`
- [ ] Production URLs use HTTPS/WSS (not HTTP/WS)
- [ ] Different API keys for dev/prod
- [ ] Service role keys are never exposed to client

---

**Last Updated:** [Current Date]

