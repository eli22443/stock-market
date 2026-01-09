# Fix Watchlist Unique Constraint Issue

## Problem

The current database constraint is causing issues:

```sql
CONSTRAINT unique_user_default_watchlist UNIQUE (user_id, is_default)
```

This constraint applies to **ALL** values of `is_default`, meaning:
- ❌ User can only have **ONE** watchlist with `is_default = true` ✅ (correct)
- ❌ User can only have **ONE** watchlist with `is_default = false` ❌ (wrong!)

This prevents users from creating multiple non-default watchlists!

## Solution

Change the constraint to a **partial unique index** that only applies when `is_default = true`.

### Step 1: Remove the Current Constraint

Run this in your Supabase SQL Editor:

```sql
-- Remove the existing constraint
ALTER TABLE public.watchlists 
DROP CONSTRAINT IF EXISTS unique_user_default_watchlist;
```

### Step 2: Create a Partial Unique Index

```sql
-- Create a partial unique index that only applies when is_default = true
CREATE UNIQUE INDEX unique_user_default_watchlist 
ON public.watchlists (user_id) 
WHERE is_default = true;
```

### What This Does

- ✅ Allows multiple watchlists with `is_default = false` (unlimited)
- ✅ Only allows ONE watchlist with `is_default = true` per user
- ✅ Much better user experience

## Alternative: Keep Current Constraint (Not Recommended)

If you want to keep the current constraint for some reason, you'll need to handle it differently in the code, but this limits users to only 2 watchlists total (one default, one non-default), which is not ideal.

## Verification

After applying the fix, test:

1. Create a watchlist with `is_default: false` ✅
2. Create another watchlist with `is_default: false` ✅ (should work now)
3. Create a watchlist with `is_default: true` ✅
4. Try to create another with `is_default: true` ❌ (should fail with proper error)

---

## Quick Fix SQL

Copy and paste this entire block into Supabase SQL Editor:

```sql
-- Remove old constraint
ALTER TABLE public.watchlists 
DROP CONSTRAINT IF EXISTS unique_user_default_watchlist;

-- Create new partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_default_watchlist 
ON public.watchlists (user_id) 
WHERE is_default = true;
```

