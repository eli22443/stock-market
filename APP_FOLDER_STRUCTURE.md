# App Folder Structure Guide

## Folders to Add to `frontend/app/`

This guide shows exactly what folders you need to create in your `app/` directory for the Supabase integration.

---

## Current Structure (What You Have)

```
frontend/app/
├── api/                    ✅ Already exists
│   ├── candles/
│   ├── news/
│   ├── quote/
│   ├── route.ts
│   ├── stocks/
│   ├── users/
│   └── world-indices/
├── favicon.ico
├── globals.css
├── layout.tsx             ✅ Already exists
├── news/
├── not-found.tsx
├── page.tsx               ✅ Already exists (home page)
├── quote/
├── stocks/
└── world-indices/
```

---

## New Folders to Add

### Phase 1: Authentication (Essential)

#### 1. Route Groups (Parentheses = Route Groups in Next.js)

```
frontend/app/
├── (auth)/                    ⭐ NEW - Public auth routes
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── layout.tsx
└── (protected)/               ⭐ NEW - Protected routes
    ├── dashboard/
    │   └── page.tsx
    ├── watchlist/
    │   └── page.tsx
    ├── portfolio/
    │   └── page.tsx
    └── layout.tsx
```

**Note:** Parentheses `()` in folder names create route groups in Next.js - they don't appear in the URL but organize routes.

**URLs will be:**

- `/login` (not `/auth/login`)
- `/signup` (not `/auth/signup`)
- `/dashboard` (not `/protected/dashboard`)
- `/watchlist` (not `/protected/watchlist`)
- `/portfolio` (not `/protected/portfolio`)

#### 2. Auth API Routes

```
frontend/app/api/
└── auth/                      ⭐ NEW
    └── callback/
        └── route.ts           # Handles OAuth callbacks from Supabase
```

#### 3. Middleware File

```
frontend/
└── middleware.ts              ⭐ NEW (at root, not in app/)
```

**Important:** `middleware.ts` goes in `frontend/` root, NOT in `app/`!

---

### Phase 2: User Features (Watchlists, Portfolios, Alerts)

#### 4. Watchlists API Routes

```
frontend/app/api/
└── watchlists/                ⭐ NEW
    ├── route.ts               # GET all, POST create
    ├── [id]/
    │   ├── route.ts           # GET one, PUT update, DELETE
    │   └── items/
    │       └── route.ts       # GET items, POST add, DELETE remove
```

#### 5. Portfolios API Routes

```
frontend/app/api/
└── portfolios/                 ⭐ NEW
    ├── route.ts               # GET all, POST create
    └── [id]/
        ├── route.ts           # GET one, PUT update, DELETE
        └── holdings/
            └── route.ts       # GET holdings, POST add, PUT update, DELETE
```

#### 6. Alerts API Routes

```
frontend/app/api/
└── alerts/                     ⭐ NEW
    ├── route.ts               # GET all, POST create
    └── [id]/
        └── route.ts           # PUT update, DELETE
```

---

## Complete Folder Structure

Here's the complete structure after adding everything:

```
frontend/app/
├── (auth)/                    ⭐ NEW
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── layout.tsx
│
├── (protected)/               ⭐ NEW
│   ├── dashboard/
│   │   └── page.tsx
│   ├── watchlist/
│   │   └── page.tsx
│   ├── portfolio/
│   │   └── page.tsx
│   └── layout.tsx
│
├── api/
│   ├── auth/                  ⭐ NEW
│   │   └── callback/
│   │       └── route.ts
│   │
│   ├── watchlists/            ⭐ NEW
│   │   ├── route.ts
│   │   └── [id]/
│   │       ├── route.ts
│   │       └── items/
│   │           └── route.ts
│   │
│   ├── portfolios/            ⭐ NEW
│   │   ├── route.ts
│   │   └── [id]/
│   │       ├── route.ts
│   │       └── holdings/
│   │           └── route.ts
│   │
│   ├── alerts/                ⭐ NEW
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   │
│   ├── candles/               ✅ Already exists
│   ├── news/                  ✅ Already exists
│   ├── quote/                  ✅ Already exists
│   ├── route.ts                ✅ Already exists
│   ├── stocks/                 ✅ Already exists
│   ├── users/                  ✅ Already exists
│   └── world-indices/          ✅ Already exists
│
├── favicon.ico                 ✅ Already exists
├── globals.css                 ✅ Already exists
├── layout.tsx                  ✅ Already exists
├── news/                       ✅ Already exists
├── not-found.tsx               ✅ Already exists
├── page.tsx                    ✅ Already exists
├── quote/                      ✅ Already exists
├── stocks/                     ✅ Already exists
└── world-indices/              ✅ Already exists

frontend/
└── middleware.ts               ⭐ NEW (at root level)
```

---

## Step-by-Step Creation Guide

### Step 1: Create Route Groups (Phase 1)

```bash
# Navigate to frontend/app
cd frontend/app

# Create auth route group
mkdir "(auth)"
mkdir "(auth)/login"
mkdir "(auth)/signup"

# Create protected route group
mkdir "(protected)"
mkdir "(protected)/dashboard"
mkdir "(protected)/watchlist"
mkdir "(protected)/portfolio"
```

**Note:** On Windows, you may need to use quotes or escape parentheses:

```bash
mkdir "(auth)"        # Works on most systems
# OR
mkdir '\(auth\)'       # Alternative syntax
```

### Step 2: Create Auth API Route

```bash
# In frontend/app/api
mkdir auth
mkdir auth/callback
```

### Step 3: Create User Features API Routes

```bash
# Watchlists
mkdir api/watchlists
mkdir api/watchlists/\[id\]
mkdir api/watchlists/\[id\]/items

# Portfolios
mkdir api/portfolios
mkdir api/portfolios/\[id\]
mkdir api/portfolios/\[id\]/holdings

# Alerts
mkdir api/alerts
mkdir api/alerts/\[id\]
```

**Note:** `[id]` is a dynamic route segment in Next.js. Use brackets in the folder name.

### Step 4: Create Middleware

```bash
# Go back to frontend root
cd ../..

# Create middleware.ts (at frontend/ root, not in app/)
touch middleware.ts
# OR on Windows:
type nul > middleware.ts
```

---

## File Checklist

### Phase 1: Authentication

- [ ] `app/(auth)/login/page.tsx`
- [ ] `app/(auth)/signup/page.tsx`
- [ ] `app/(auth)/layout.tsx`
- [ ] `app/(protected)/dashboard/page.tsx`
- [ ] `app/(protected)/watchlist/page.tsx`
- [ ] `app/(protected)/portfolio/page.tsx`
- [ ] `app/(protected)/layout.tsx`
- [ ] `app/api/auth/callback/route.ts`
- [ ] `middleware.ts` (at `frontend/` root)

### Phase 2: Watchlists

- [ ] `app/api/watchlists/route.ts`
- [ ] `app/api/watchlists/[id]/route.ts`
- [ ] `app/api/watchlists/[id]/items/route.ts`

### Phase 3: Portfolios

- [ ] `app/api/portfolios/route.ts`
- [ ] `app/api/portfolios/[id]/route.ts`
- [ ] `app/api/portfolios/[id]/holdings/route.ts`

### Phase 4: Alerts

- [ ] `app/api/alerts/route.ts`
- [ ] `app/api/alerts/[id]/route.ts`

---

## Important Notes

### 1. Route Groups `(auth)` and `(protected)`

- Parentheses create route groups - they organize routes but don't appear in URLs
- `/login` not `/auth/login`
- `/dashboard` not `/protected/dashboard`
- Use them to apply layouts and middleware to groups of routes

### 2. Dynamic Routes `[id]`

- Square brackets create dynamic route segments
- `[id]` matches any value (e.g., `/watchlists/123`, `/watchlists/abc`)
- Access via `params.id` in your route handler

### 3. Middleware Location

- `middleware.ts` goes in `frontend/` root, NOT in `app/`
- Next.js automatically detects it at the project root
- It runs before all requests

### 4. Existing Routes

- Your existing routes (`/news`, `/quote`, `/stocks`, etc.) remain unchanged
- They can be made protected later if needed
- Public routes don't need to be in route groups

---

## Quick Reference: What Each Folder Does

| Folder                  | Purpose                | URL Example          |
| ----------------------- | ---------------------- | -------------------- |
| `(auth)/login`          | Login page             | `/login`             |
| `(auth)/signup`         | Signup page            | `/signup`            |
| `(protected)/dashboard` | User dashboard         | `/dashboard`         |
| `(protected)/watchlist` | Watchlist management   | `/watchlist`         |
| `(protected)/portfolio` | Portfolio management   | `/portfolio`         |
| `api/auth/callback`     | OAuth callback handler | `/api/auth/callback` |
| `api/watchlists`        | Watchlist API          | `/api/watchlists`    |
| `api/portfolios`        | Portfolio API          | `/api/portfolios`    |
| `api/alerts`            | Alerts API             | `/api/alerts`        |

---

## Priority Order

**Start with these (Phase 1 - Essential):**

1. `(auth)/login/` and `(auth)/signup/`
2. `(auth)/layout.tsx`
3. `(protected)/dashboard/`
4. `(protected)/layout.tsx`
5. `api/auth/callback/`
6. `middleware.ts`

**Then add (Phase 2 - User Features):** 7. `api/watchlists/` and subfolders 8. `api/portfolios/` and subfolders 9. `api/alerts/` and subfolders 10. `(protected)/watchlist/` and `(protected)/portfolio/`

---

## Testing Your Structure

After creating folders, verify:

1. **Route groups work:**

   - Visit `/login` - should work
   - Visit `/dashboard` - should redirect to `/login` if not authenticated

2. **API routes exist:**

   - Check `app/api/watchlists/route.ts` exists
   - Check `app/api/portfolios/route.ts` exists

3. **Middleware runs:**
   - Check browser console for middleware logs
   - Protected routes should redirect if not authenticated

---

## Troubleshooting

### "Cannot find module" errors

- Check folder names match exactly (case-sensitive)
- Verify `[id]` uses square brackets, not parentheses

### Routes not working

- Ensure `page.tsx` exists in each route folder
- Check `layout.tsx` exists in route groups

### Middleware not running

- Verify `middleware.ts` is in `frontend/` root, not `app/`
- Check file is named exactly `middleware.ts` (not `middleware.js`)

### Route groups not working

- Ensure parentheses are correct: `(auth)` not `[auth]` or `{auth}`
- Route groups are for organization, not URL segments

---

**Ready to start?** Begin with Phase 1 folders, then move to Phase 2 as you implement features!
