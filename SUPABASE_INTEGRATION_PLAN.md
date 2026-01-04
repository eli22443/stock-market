# Supabase Integration Plan

## Stock Market App - Authentication, Database & User Features

**Architecture Decision:** Keep Python FastAPI backend separate, integrate Supabase for auth and database.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Phase 1: Setup & Configuration](#phase-1-setup--configuration)
4. [Phase 2: Authentication](#phase-2-authentication)
5. [Phase 3: Database Schema](#phase-3-database-schema)
6. [Phase 4: Frontend Integration](#phase-4-frontend-integration)
7. [Phase 5: User Features](#phase-5-user-features)
8. [Phase 6: Python Backend Integration](#phase-6-python-backend-integration)
9. [Phase 7: Future AI Capabilities](#phase-7-future-ai-capabilities)
10. [Environment Variables](#environment-variables)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Goals

- ✅ Add user authentication (email/password, OAuth)
- ✅ Implement user database with PostgreSQL
- ✅ Enable user-specific features (watchlists, portfolios, alerts)
- ✅ Prepare for future AI capabilities
- ✅ Maintain existing Python WebSocket backend
- ✅ Deploy to Vercel (frontend) + separate service (backend)

### Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend:** Python FastAPI (separate deployment)
- **Auth & Database:** Supabase (PostgreSQL + Auth)
- **Deployment:** Vercel (frontend) + Railway/Render (Python backend)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Next.js)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Frontend (App Router)                            │  │
│  │  ├── (auth)/login, signup                         │  │
│  │  ├── (protected)/dashboard, watchlist             │  │
│  │  └── Public routes                                │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  API Routes (Serverless Functions)                │  │
│  │  ├── /api/auth/* (Supabase callbacks)             │  │
│  │  ├── /api/watchlists/*                            │  │
│  │  └── /api/portfolios/*                            │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Supabase Client (Browser + Server)               │  │
│  │  ├── Auth                                         │  │
│  │  ├── Database (PostgreSQL)                        │  │
│  │  └── Realtime Subscriptions                       │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/WebSocket
                     ↓
┌─────────────────────────────────────────────────────────┐
│     Separate Server (Python FastAPI)                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │  WebSocket Manager                                │  │
│  │  ├── Finnhub WebSocket Connection                 │  │
│  │  ├── Client Management                            │  │
│  │  └── Subscription Manager                         │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Optional: Supabase Client (Python)               │  │
│  │  └── For user-specific WebSocket filtering        │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ WebSocket
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Finnhub WebSocket API                      │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Setup & Configuration

### 1.1 Create Supabase Project

**Steps:**

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Choose organization/workspace
4. Set project name: `stock-market-app`
5. Set database password (save securely)
6. Choose region closest to users
7. Wait for project initialization (~2 minutes)

**Output:**

- Project URL: `https://xxxxx.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 1.2 Install Supabase Dependencies

**Frontend:**

```bash
cd frontend
npm install @supabase/supabase-js @supabase/ssr
npm install --save-dev @supabase/cli  # Optional: for local development
```

**Python Backend (optional, for future):**

```bash
cd backend
pip install supabase
```

### 1.3 Create Supabase Client Files

**File Structure:**

```
frontend/
├── lib/
│   └── supabase/
│       ├── client.ts          # Browser client
│       ├── server.ts           # Server-side client
│       └── middleware.ts       # Middleware client
```

**Files to Create:**

- `frontend/lib/supabase/client.ts` - Browser client for client components
- `frontend/lib/supabase/server.ts` - Server client for Server Components & API routes
- `frontend/lib/supabase/middleware.ts` - Middleware client for route protection

### 1.4 Environment Variables

**Create/Update `.env.local` in `frontend/`:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role (for server-side operations only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Python Backend WebSocket URL
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
# Production: NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app/ws
```

**Create/Update `.env` in `backend/` (optional):**

```env
# Existing
FINNHUB_API_KEY=your_finnhub_key
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000

# New: Supabase (for future user-specific features)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Phase 2: Authentication

### 2.1 Database Schema - Auth Tables

Supabase automatically creates `auth.users` table. We need to create a `profiles` table to extend user data.

**SQL Migration (run in Supabase SQL Editor):**

```sql
-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 2.2 Frontend Auth Structure

**Create Route Groups:**

```
frontend/app/
├── (auth)/                    # Public auth routes
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── layout.tsx
├── (protected)/               # Protected routes
│   ├── dashboard/
│   │   └── page.tsx
│   ├── watchlist/
│   │   └── page.tsx
│   └── layout.tsx
└── middleware.ts              # Auth middleware
```

### 2.3 Auth Components

**Components to Create:**

- `frontend/components/auth/LoginForm.tsx`
- `frontend/components/auth/SignupForm.tsx`
- `frontend/components/auth/UserMenu.tsx` (dropdown with profile/logout)
- `frontend/components/auth/AuthGuard.tsx` (wrapper for protected content)

### 2.4 Auth Context/Hooks

**Create:**

- `frontend/context/AuthContext.tsx` - Global auth state
- `frontend/hooks/useAuth.ts` - Auth hook for components

### 2.5 Middleware for Route Protection

**Create `frontend/middleware.ts`:**

- Protect routes under `(protected)/`
- Redirect unauthenticated users to `/login`
- Allow public access to `(auth)/` routes

---

## Phase 3: Database Schema

### 3.1 Watchlists Schema

```sql
-- Watchlists table
CREATE TABLE public.watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_user_default_watchlist UNIQUE (user_id, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- Watchlist items table
CREATE TABLE public.watchlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  notes TEXT,
  UNIQUE(watchlist_id, symbol)
);

-- Enable RLS
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

-- Policies for watchlists
CREATE POLICY "Users can view own watchlists"
  ON public.watchlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own watchlists"
  ON public.watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlists"
  ON public.watchlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlists"
  ON public.watchlists FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for watchlist_items
CREATE POLICY "Users can view own watchlist items"
  ON public.watchlist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE watchlists.id = watchlist_items.watchlist_id
      AND watchlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own watchlist items"
  ON public.watchlist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE watchlists.id = watchlist_items.watchlist_id
      AND watchlists.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX idx_watchlist_items_watchlist_id ON public.watchlist_items(watchlist_id);
CREATE INDEX idx_watchlist_items_symbol ON public.watchlist_items(symbol);

-- Updated_at trigger
CREATE TRIGGER set_updated_at_watchlists
  BEFORE UPDATE ON public.watchlists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 3.2 Portfolios Schema

```sql
-- Portfolios table
CREATE TABLE public.portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Portfolio holdings table
CREATE TABLE public.holdings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  shares DECIMAL(15, 6) NOT NULL CHECK (shares > 0),
  avg_price DECIMAL(15, 2) NOT NULL CHECK (avg_price > 0),
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

-- Policies for portfolios
CREATE POLICY "Users can view own portfolios"
  ON public.portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own portfolios"
  ON public.portfolios FOR ALL
  USING (auth.uid() = user_id);

-- Policies for holdings
CREATE POLICY "Users can view own holdings"
  ON public.holdings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = holdings.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own holdings"
  ON public.holdings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = holdings.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX idx_holdings_portfolio_id ON public.holdings(portfolio_id);
CREATE INDEX idx_holdings_symbol ON public.holdings(symbol);

-- Updated_at triggers
CREATE TRIGGER set_updated_at_portfolios
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_holdings
  BEFORE UPDATE ON public.holdings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 3.3 Alerts Schema

```sql
-- Alerts table
CREATE TABLE public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('price_above', 'price_below', 'price_change_percent', 'volume_spike')),
  threshold DECIMAL(15, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own alerts"
  ON public.alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own alerts"
  ON public.alerts FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_symbol ON public.alerts(symbol);
CREATE INDEX idx_alerts_active ON public.alerts(is_active) WHERE is_active = TRUE;

-- Updated_at trigger
CREATE TRIGGER set_updated_at_alerts
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 3.4 User Preferences Schema

```sql
-- User preferences table
CREATE TABLE public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE SET NULL,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
  currency TEXT DEFAULT 'USD',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_alerts_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_updated_at_preferences
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

---

## Phase 4: Frontend Integration

### 4.1 Supabase Client Setup

**Files to Create:**

1. **`frontend/lib/supabase/client.ts`**

   - Browser client for client components
   - Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **`frontend/lib/supabase/server.ts`**

   - Server client for Server Components
   - Uses cookies for session management

3. **`frontend/lib/supabase/middleware.ts`**
   - Middleware client for route protection
   - Handles auth state in middleware

### 4.2 Auth Context & Hooks

**Create `frontend/context/AuthContext.tsx`:**

- Provides auth state to entire app
- Wraps app in `RootLayout`
- Exposes: `user`, `session`, `loading`, `signIn`, `signOut`, `signUp`

**Create `frontend/hooks/useAuth.ts`:**

- Custom hook to access auth context
- Returns user, session, and auth methods

### 4.3 Auth Components

**Components to Create:**

1. **`frontend/components/auth/LoginForm.tsx`**

   - Email/password login
   - OAuth buttons (Google, GitHub)
   - Error handling
   - Redirect after login

2. **`frontend/components/auth/SignupForm.tsx`**

   - Email/password signup
   - Username input
   - Email verification notice
   - Redirect to login after signup

3. **`frontend/components/auth/UserMenu.tsx`**

   - Dropdown menu in header
   - Shows user avatar/name
   - Links to profile, settings
   - Logout button

4. **`frontend/components/auth/AuthGuard.tsx`**
   - Wrapper component for protected content
   - Shows loading state
   - Redirects to login if not authenticated

### 4.4 Route Structure

**Update `frontend/app/`:**

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── signup/
│   │   └── page.tsx          # Signup page
│   └── layout.tsx             # Auth layout (no auth required)
├── (protected)/
│   ├── dashboard/
│   │   └── page.tsx          # User dashboard
│   ├── watchlist/
│   │   └── page.tsx          # Watchlist management
│   ├── portfolio/
│   │   └── page.tsx          # Portfolio management
│   └── layout.tsx             # Protected layout (requires auth)
├── api/
│   └── auth/
│       └── callback/
│           └── route.ts      # Supabase auth callback handler
└── middleware.ts              # Route protection middleware
```

### 4.5 Middleware Implementation

**Create `frontend/middleware.ts`:**

- Check auth status using Supabase middleware client
- Protect routes under `(protected)/`
- Redirect to `/login` if not authenticated
- Allow public access to `(auth)/` routes
- Preserve intended destination for redirect after login

### 4.6 Update Existing Components

**Components to Update:**

1. **`frontend/components/Header.tsx`** (or create if doesn't exist)

   - Add `UserMenu` component
   - Show login button if not authenticated
   - Show user menu if authenticated

2. **`frontend/app/layout.tsx`**

   - Wrap with `AuthProvider` (from AuthContext)
   - Keep existing `WebSocketProvider`

3. **`frontend/components/NavBar.tsx`**
   - Add protected route links (watchlist, portfolio)
   - Hide/show based on auth status

---

## Phase 5: User Features

### 5.1 Watchlists API Routes

**Create `frontend/app/api/watchlists/route.ts`:**

- `GET` - Fetch user's watchlists
- `POST` - Create new watchlist

**Create `frontend/app/api/watchlists/[id]/route.ts`:**

- `GET` - Get watchlist by ID
- `PUT` - Update watchlist
- `DELETE` - Delete watchlist

**Create `frontend/app/api/watchlists/[id]/items/route.ts`:**

- `GET` - Get watchlist items
- `POST` - Add symbol to watchlist
- `DELETE` - Remove symbol from watchlist

### 5.2 Watchlists Components

**Components to Create:**

1. **`frontend/components/watchlists/WatchlistList.tsx`**

   - Display user's watchlists
   - Create new watchlist button
   - Delete watchlist

2. **`frontend/components/watchlists/WatchlistView.tsx`**

   - Display watchlist items (stocks)
   - Add/remove symbols
   - Show stock prices (integrate with existing StockCard)

3. **`frontend/components/watchlists/AddToWatchlist.tsx`**
   - Button/dialog to add stock to watchlist
   - Select watchlist dropdown
   - Quick add to default watchlist

### 5.3 Portfolios API Routes

**Create `frontend/app/api/portfolios/route.ts`:**

- `GET` - Fetch user's portfolios
- `POST` - Create new portfolio

**Create `frontend/app/api/portfolios/[id]/route.ts`:**

- `GET` - Get portfolio by ID with holdings
- `PUT` - Update portfolio
- `DELETE` - Delete portfolio

**Create `frontend/app/api/portfolios/[id]/holdings/route.ts`:**

- `GET` - Get portfolio holdings
- `POST` - Add holding
- `PUT` - Update holding
- `DELETE` - Remove holding

### 5.4 Portfolios Components

**Components to Create:**

1. **`frontend/components/portfolios/PortfolioList.tsx`**

   - Display user's portfolios
   - Create new portfolio button

2. **`frontend/components/portfolios/PortfolioView.tsx`**

   - Display portfolio holdings
   - Show current value, gains/losses
   - Add/edit/remove holdings

3. **`frontend/components/portfolios/AddHoldingForm.tsx`**
   - Form to add holding (symbol, shares, price, date)
   - Validation

### 5.5 Alerts API Routes

**Create `frontend/app/api/alerts/route.ts`:**

- `GET` - Fetch user's alerts
- `POST` - Create new alert

**Create `frontend/app/api/alerts/[id]/route.ts`:**

- `PUT` - Update alert
- `DELETE` - Delete alert

### 5.6 Alerts Components

**Components to Create:**

1. **`frontend/components/alerts/AlertList.tsx`**

   - Display user's alerts
   - Show active/inactive status
   - Create new alert button

2. **`frontend/components/alerts/CreateAlertForm.tsx`**
   - Form to create alert
   - Select symbol, alert type, threshold
   - Validation

---

## Phase 6: Python Backend Integration

### 6.1 Optional: User-Specific WebSocket Filtering

**Goal:** Filter WebSocket updates based on user's watchlists/portfolios.

**Implementation Options:**

**Option A: Frontend Filtering (Recommended)**

- Python backend sends all subscribed symbols
- Frontend filters updates based on user's watchlists
- Simpler, no changes to Python backend

**Option B: Backend Filtering (Advanced)**

- Python backend connects to Supabase
- Receives user_id in WebSocket connection
- Only subscribes to symbols in user's watchlists
- More efficient but more complex

### 6.2 Python Backend Changes (Optional)

**If implementing Option B:**

1. **Install Supabase Python client:**

   ```bash
   cd backend
   pip install supabase
   ```

2. **Update `backend/main.py`:**

   - Accept `user_id` in WebSocket connection (via auth token)
   - Query Supabase for user's watchlists
   - Filter subscriptions based on watchlists

3. **Update `backend/subscription_manager.py`:**

   - Add user context to subscriptions
   - Filter broadcasts by user

4. **Update Frontend WebSocket Connection:**
   - Send auth token with WebSocket connection
   - Python backend validates token with Supabase

### 6.3 Environment Variables (Backend)

**Update `backend/.env`:**

```env
# Existing
FINNHUB_API_KEY=your_finnhub_key
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000

# New: Supabase (if implementing user filtering)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Phase 7: Future AI Capabilities

### 7.1 AI Integration Architecture

**Option A: Supabase Edge Functions**

- Deploy AI processing as Supabase Edge Functions
- Call from Next.js API routes
- Store results in Supabase database

**Option B: Vercel AI SDK**

- Use Vercel AI SDK in Next.js API routes
- Integrate with OpenAI, Anthropic, etc.
- Store results in Supabase

**Option C: Separate AI Service**

- Deploy AI service separately (e.g., Python FastAPI)
- Call from Next.js API routes
- Store results in Supabase

### 7.2 Database Schema for AI Features

**AI Insights Table:**

```sql
CREATE TABLE public.ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('analysis', 'prediction', 'recommendation', 'summary')),
  content JSONB NOT NULL,
  model TEXT, -- e.g., 'gpt-4', 'claude-3'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own insights"
  ON public.ai_insights FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL); -- Allow public insights

CREATE POLICY "Users can create own insights"
  ON public.ai_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX idx_ai_insights_symbol ON public.ai_insights(symbol);
CREATE INDEX idx_ai_insights_type ON public.ai_insights(insight_type);
```

**AI Chat History Table:**

```sql
CREATE TABLE public.ai_chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own chat history"
  ON public.ai_chat_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat history"
  ON public.ai_chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_ai_chat_user_id ON public.ai_chat_history(user_id);
CREATE INDEX idx_ai_chat_session_id ON public.ai_chat_history(session_id);
```

### 7.3 AI API Routes (Future)

**Create `frontend/app/api/ai/insights/route.ts`:**

- `POST` - Generate AI insight for symbol
- `GET` - Fetch user's AI insights

**Create `frontend/app/api/ai/chat/route.ts`:**

- `POST` - Send chat message, get AI response
- `GET` - Fetch chat history

### 7.4 AI Components (Future)

**Components to Create:**

1. **`frontend/components/ai/AIInsights.tsx`**

   - Display AI-generated insights for stocks
   - Analysis, predictions, recommendations

2. **`frontend/components/ai/AIChat.tsx`**
   - Chat interface for AI assistant
   - Ask questions about stocks
   - View chat history

---

## Environment Variables

### Frontend (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Python Backend WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
# Production: NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app/ws

# AI (Future)
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

### Backend (`.env`)

```env
# Existing
FINNHUB_API_KEY=your_finnhub_key
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000

# Supabase (Optional - for user filtering)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Vercel Environment Variables

**Set in Vercel Dashboard:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_WS_URL` (production backend URL)

---

## Testing Strategy

### 1. Unit Tests

**Test Files to Create:**

- `frontend/__tests__/lib/supabase/client.test.ts`
- `frontend/__tests__/hooks/useAuth.test.ts`
- `frontend/__tests__/components/auth/LoginForm.test.tsx`

### 2. Integration Tests

**Test Scenarios:**

- User signup → profile creation
- User login → session management
- Protected route access
- Watchlist CRUD operations
- Portfolio CRUD operations

### 3. E2E Tests (Optional)

**Using Playwright or Cypress:**

- Complete auth flow
- Create watchlist, add stocks
- Create portfolio, add holdings
- Test protected routes

### 4. Manual Testing Checklist

- [ ] Sign up new user
- [ ] Login with email/password
- [ ] Login with OAuth (Google/GitHub)
- [ ] Access protected routes
- [ ] Create watchlist
- [ ] Add stocks to watchlist
- [ ] Create portfolio
- [ ] Add holdings to portfolio
- [ ] Create alerts
- [ ] Logout
- [ ] WebSocket still works after auth

---

## Deployment Checklist

### Frontend (Vercel)

- [ ] Create Vercel project
- [ ] Connect GitHub repository
- [ ] Set environment variables in Vercel dashboard
- [ ] Configure build settings (Next.js, Node.js version)
- [ ] Deploy and test production URL
- [ ] Update `NEXT_PUBLIC_WS_URL` to production backend URL

### Backend (Railway/Render)

- [ ] Create account on Railway or Render
- [ ] Create new project/service
- [ ] Connect GitHub repository (or deploy from local)
- [ ] Set environment variables
- [ ] Configure start command: `python main.py` or `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Deploy and get production URL
- [ ] Update frontend `NEXT_PUBLIC_WS_URL` environment variable
- [ ] Test WebSocket connection from production frontend

### Supabase

- [ ] Verify production Supabase project
- [ ] Run all SQL migrations in production database
- [ ] Configure OAuth providers (Google, GitHub) if using
- [ ] Set up email templates (optional)
- [ ] Configure CORS if needed (usually not needed for Next.js)

### Post-Deployment

- [ ] Test authentication flow in production
- [ ] Test WebSocket connection in production
- [ ] Test watchlist/portfolio features
- [ ] Monitor Supabase dashboard for errors
- [ ] Monitor Vercel logs for frontend errors
- [ ] Monitor backend logs for WebSocket issues

---

## Migration Phases Summary

### Phase 1: Setup ✅ COMPLETE

- [x] Create Supabase project
- [x] Install dependencies
- [x] Set up client files (client.ts, server.ts, middleware.ts)
- [x] Configure environment variables

### Phase 2: Authentication ✅ COMPLETE

- [x] Create profiles table (if not done, do this next)
- [x] Implement auth components (LoginForm, SignupForm, etc.)
- [x] Set up middleware with route protection
- [x] Test auth flow (email/password working, Google OAuth configured)
- [x] Auth API routes (callback, confirm)
- [x] Server actions and client functions

### Phase 3: Database ✅ COMPLETE

- [x] Create profiles table ✅
- [x] Create watchlists and watchlist_items tables ✅
- [x] Create portfolios and holdings tables ✅
- [x] Create alerts table ✅
- [x] Set up RLS policies for all tables ✅
- [x] Create database triggers (handle_new_user, handle_updated_at) ✅
- [x] Test database operations ✅

### Phase 4: Frontend Integration ✅ MOSTLY COMPLETE

- [x] Route structure (auth and protected routes)
- [x] Protected routes with middleware
- [x] Auth components created
- [x] Dashboard page (basic implementation)
- [ ] Implement watchlist/portfolio/alert pages (currently placeholders)
- [ ] Connect components to API routes

### Phase 5: User Features ⏳ NEXT STEP

- [x] API route placeholders created ✅
- [x] Component structure exists ✅
- [x] Database tables ready ✅
- [ ] Implement watchlists API routes (replace placeholders) ⏳ **START HERE**
- [ ] Implement portfolios API routes (replace placeholders)
- [ ] Implement alerts API routes (replace placeholders)
- [ ] Connect components to real data
- [ ] Test all features

### Phase 6: Backend Integration (Optional, Future)

- [ ] Add Supabase to Python backend (if needed)
- [ ] Implement user filtering (if desired)
- [ ] Test WebSocket with auth

### Phase 7: AI Capabilities (Future)

- [ ] Set up AI service
- [ ] Create AI database tables
- [ ] Implement AI API routes
- [ ] Create AI components

---

## Notes & Considerations

### Security

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Always use RLS policies for database access
- Validate user input on both client and server
- Use Supabase's built-in auth validation

### Performance

- Use Supabase indexes for frequently queried columns
- Consider caching watchlist/portfolio data
- Use Supabase Realtime for live updates (optional)
- Optimize database queries

### Scalability

- Supabase free tier: 500MB database, 2GB bandwidth
- Consider upgrading for production
- Monitor Supabase usage dashboard
- Python backend can scale independently

### Cost Estimation

- **Supabase:** Free tier → $25/month (Pro) for production
- **Vercel:** Free tier → $20/month (Pro) for production
- **Backend Hosting:** Free tier (Railway/Render) → $5-20/month
- **Total:** ~$50-65/month for production

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Vercel Deployment](https://vercel.com/docs)

---

**Last Updated:** Current
**Status:** Phase 3 Complete, Phase 5 In Progress
**Next Steps:**

1. ✅ **Create Database Schema** (Phase 3) - COMPLETE
2. **Implement API Routes** (Phase 5) - Replace placeholders with real Supabase queries ⏳ **START HERE**
3. **Connect Components** (Phase 5) - Wire up components to fetch/display real data
