# Current Progress & Next Steps

## ✅ What's Complete

### Phase 1: Setup ✅

- [x] Supabase project created
- [x] Dependencies installed (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Client files created:
  - `lib/supabase/client.ts` (browser client)
  - `lib/supabase/server.ts` (server client)
  - `lib/supabase/middleware.ts` (middleware client)
- [x] Environment variables configured

### Phase 2: Authentication ✅

- [x] Route groups created:
  - `(auth)/login`, `(auth)/signup`, `(auth)/logout`
  - `(protected)/dashboard`, `(protected)/watchlist`, `(protected)/portfolio`
- [x] Auth components:
  - `LoginForm.tsx` (email/password + Google OAuth)
  - `SignupForm.tsx` (email/password signup)
  - `SignInWithGoogleButton.tsx` (Google OAuth)
  - `LoginLogoutButton.tsx` (login/logout toggle)
  - `AuthGuard.tsx` (protected content wrapper)
  - `UserMenu.tsx` (user dropdown menu)
- [x] Auth API routes:
  - `api/auth/callback/route.ts` (OAuth callback handler)
  - `api/auth/confirm/route.ts` (email confirmation)
- [x] Server actions:
  - `services/auth-actions.ts` (login, signup, signout)
- [x] Client functions:
  - `services/auth-client.ts` (signInWithGoogle)
- [x] Middleware:
  - Route protection working
  - Session refresh working
  - Redirects authenticated users away from auth pages
  - Redirects unauthenticated users to login
- [x] Dashboard page shows user info

### Phase 4: Frontend Structure ✅

- [x] All route folders created
- [x] All component files created (placeholders)
- [x] All API route files created (placeholders)

### Phase 3: Database Schema ✅ **COMPLETE**

- [x] Profiles table created with triggers
- [x] Watchlists and watchlist_items tables created
- [x] Portfolios and holdings tables created
- [x] Alerts table created
- [x] All RLS policies configured
- [x] All triggers and functions created

---

## ⏳ What Needs Implementation

### Phase 5: Implement API Routes ⏳ **NEXT STEP**

**Priority: HIGH - Do this now!**

Now that the database tables are created, you can implement the API routes to interact with them.

#### ✅ Step 1: Create Profiles Table - COMPLETE

~~Go to Supabase Dashboard → SQL Editor and run:~~

```sql
-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
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
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

#### ✅ Step 2: Create Watchlists Tables - COMPLETE

```sql
-- Watchlists table
CREATE TABLE IF NOT EXISTS public.watchlists (
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
CREATE TABLE IF NOT EXISTS public.watchlist_items (
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist_id ON public.watchlist_items(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_symbol ON public.watchlist_items(symbol);

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at_watchlists ON public.watchlists;
CREATE TRIGGER set_updated_at_watchlists
  BEFORE UPDATE ON public.watchlists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

#### ✅ Step 3: Create Portfolios Tables - COMPLETE

```sql
-- Portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Portfolio holdings table
CREATE TABLE IF NOT EXISTS public.holdings (
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
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON public.holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON public.holdings(symbol);

-- Updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at_portfolios ON public.portfolios;
CREATE TRIGGER set_updated_at_portfolios
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_holdings ON public.holdings;
CREATE TRIGGER set_updated_at_holdings
  BEFORE UPDATE ON public.holdings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

#### ✅ Step 4: Create Alerts Table - COMPLETE

```sql
-- Alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
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
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON public.alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts(is_active) WHERE is_active = TRUE;

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at_alerts ON public.alerts;
CREATE TRIGGER set_updated_at_alerts
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

---

### Phase 5: Implement API Routes ⏳ **NEXT STEP**

Now that database tables are created, implement the API routes:

#### Watchlists API (`app/api/watchlists/route.ts`)

**Current:** Placeholder returning empty array
**Needs:** Real Supabase queries

```typescript
// GET - Fetch user's watchlists
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("watchlists")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST - Create new watchlist
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, is_default } = body;

  const { data, error } = await supabase
    .from("watchlists")
    .insert({
      user_id: user.id,
      name,
      description,
      is_default: is_default || false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
```

#### Similar Implementation Needed For:

- `app/api/watchlists/[id]/route.ts` (GET, PUT, DELETE)
- `app/api/watchlists/[id]/items/route.ts` (GET, POST, DELETE)
- `app/api/portfolios/route.ts` (GET, POST)
- `app/api/portfolios/[id]/route.ts` (GET, PUT, DELETE)
- `app/api/portfolios/[id]/holdings/route.ts` (GET, POST, PUT, DELETE)
- `app/api/alerts/route.ts` (GET, POST)
- `app/api/alerts/[id]/route.ts` (PUT, DELETE)

---

### Phase 6: Connect Components ⏳ **AFTER API ROUTES**

Once API routes are working, connect components to fetch/display real data:

#### Watchlist Page (`app/(protected)/watchlist/page.tsx`)

**Current:** Placeholder
**Needs:** Fetch watchlists and display using `WatchlistList` component

```typescript
import { createClient } from "@/lib/supabase/server";
import WatchlistList from "@/components/watchlists/WatchlistList";

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch watchlists from API or directly from Supabase
  const response = await fetch(
    `${process.env.NEXT_URL || "http://localhost:3000"}/api/watchlists`
  );
  const watchlists = await response.json();

  return (
    <div className="watchlist-page px-6">
      <h1 className="text-2xl font-bold mb-4">My Watchlists</h1>
      <WatchlistList watchlists={watchlists} />
    </div>
  );
}
```

#### Similar Implementation Needed For:

- `app/(protected)/portfolio/page.tsx`
- Update `WatchlistList`, `WatchlistView`, `AddToWatchlist` components
- Update `PortfolioList`, `PortfolioView`, `AddHoldingForm` components
- Update `AlertList`, `CreateAlertForm` components

---

## 🎯 Recommended Next Steps (In Order)

### ✅ 1. **Create Database Schema** - COMPLETE

- [x] Tables created in Supabase
- [x] RLS policies configured
- [x] Triggers and functions created

### 2. **Test Database** (15 minutes) - Optional but Recommended

- Sign up a test user (if not done already)
- Check if profile is auto-created (trigger should work)
- Manually insert a test watchlist in Supabase Table Editor to verify RLS policies work

### 3. **Implement Watchlists API** (1-2 hours) - **START HERE**

- Replace placeholder in `app/api/watchlists/route.ts`
- Implement GET and POST
- Test with Postman or browser

### 4. **Connect Watchlist Components** (1 hour)

- Update `app/(protected)/watchlist/page.tsx` to fetch data
- Update `WatchlistList` component to display data
- Test full flow: create watchlist → add items → view

### 5. **Repeat for Portfolios** (1-2 hours)

- Same process as watchlists

### 6. **Repeat for Alerts** (1 hour)

- Same process

---

## 📊 Progress Summary

**Completed:** ~75%

- ✅ Authentication (100%)
- ✅ Frontend structure (100%)
- ✅ Database schema (100%) - **JUST COMPLETED!**
- ⏳ API implementation (0% - **NEXT STEP**)
- ⏳ Component integration (0% - after API)

**Estimated Time to Complete:**

- ✅ Database schema: DONE
- ⏳ API routes: 4-6 hours (start now!)
- ⏳ Component integration: 3-4 hours
- **Remaining:** ~7-10 hours of focused work

---

## 🚀 Quick Start: Implement API Routes Now

1. **Start with Watchlists API** (`app/api/watchlists/route.ts`)

   - Replace placeholder with real Supabase queries (code example above)
   - Test GET endpoint: Visit `http://localhost:3000/api/watchlists` (while logged in)
   - Test POST endpoint: Use Postman or fetch from browser console

2. **Then implement Watchlist Items API** (`app/api/watchlists/[id]/items/route.ts`)

   - Add GET, POST, DELETE handlers
   - Test adding/removing items from watchlists

3. **Repeat for Portfolios and Alerts**

   - Same pattern as watchlists
   - Use the code examples above as templates

4. **Test Everything**
   - Create a watchlist via API
   - Add items to it
   - Verify data appears in Supabase Table Editor
   - Check RLS policies are working (can't access other users' data)
