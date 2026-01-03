# Dev Mode Rate Limit Fix

## The Problem

Even on different IPs, Yahoo Finance is still rate limiting. This is because:

1. **Yahoo Finance rate limits are based on request patterns**, not just IP
2. **The `yahoo-finance2` library** uses a specific user agent that Yahoo might be tracking
3. **Dev mode makes requests on every page refresh** (caching doesn't work)
4. **Search API** (`yh.search()`) has stricter rate limits than other endpoints

## Solutions

### Option 1: Use Mock Data in Dev Mode (Recommended)

Add this to your `.env.local`:

```bash
USE_MOCK_NEWS=true
```

This will skip news fetching in dev mode and return empty array, preventing rate limits during development.

**To use real news in dev mode:**
- Remove `USE_MOCK_NEWS=true` from `.env.local`
- Or set it to `false`

### Option 2: Reduce News Count

I've already reduced `newsCount` from 50 to 20 in the code to be more respectful.

### Option 3: Use Production Mode

Build and run in production mode where caching actually works:

```bash
npm run build
npm start
```

Caching will prevent repeated API calls.

### Option 4: Wait Longer

Yahoo Finance rate limits can persist for **24-48 hours** even on different IPs if the request patterns are similar.

## Current Behavior

- ✅ News API now returns empty array on rate limit (won't crash)
- ✅ Reduced news count from 50 to 20
- ✅ Better error handling for 429 errors
- ✅ Option to use mock data in dev mode

## Quick Fix for Development

1. **Add to `.env.local`:**
   ```bash
   USE_MOCK_NEWS=true
   ```

2. **Restart dev server:**
   ```bash
   npm run dev
   ```

3. **News page will show "No market news available"** instead of crashing

4. **When ready to test real news:**
   - Remove `USE_MOCK_NEWS` from `.env.local`
   - Or wait 24-48 hours for rate limit to fully reset

