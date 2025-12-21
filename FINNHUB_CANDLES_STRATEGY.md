# Alpha Vantage Stock Candles API - Free Tier Strategy

## ⚠️ Alpha Vantage: Limited Free Tier

**Alpha Vantage** provides **limited free** access to historical candlestick data via their API. However, there are significant limitations:

### Alpha Vantage Free Tier Limitations:

- ✅ **Daily data available** - But only ~100 data points (~3 months)
- ✅ **Weekly/Monthly data available** - ~100 data points
- ❌ **Intraday data requires PREMIUM** - All intervals (1min, 5min, 15min, 30min, 60min)
- ❌ **Full historical data requires PREMIUM** - Beyond ~100 data points

### Why This Is Problematic:

- ⚠️ **Limited historical data** - Only ~3 months of daily data
- ⚠️ **No intraday charts** - Cannot show minute/hourly charts
- ⚠️ **Not suitable for full-featured charts** - Limited time ranges

**See `ALPHA_VANTAGE_LIMITATIONS.md` for detailed solutions and alternatives.**

---

## 📊 Understanding Alpha Vantage Limits

### Free Tier Limits:

- **5 API calls per minute** (rate limit)
- **500 API calls per day** (daily limit)
- **Only ~100 data points** for daily/weekly/monthly data (~3 months)
- **Intraday data NOT available** - Requires Premium subscription
- **Full historical data NOT available** - Requires Premium subscription

### Supported Resolutions (Free Tier):

- ✅ `D` (Daily) - ~100 data points (~3 months)
- ✅ `W` (Weekly) - ~100 data points (~2 years)
- ✅ `M` (Monthly) - ~100 data points (~8 years)
- ❌ `1`, `5`, `15`, `30`, `60` (Intraday) - **Premium only**

### What 5 calls/minute means:

- **1 call every 12 seconds** (with buffer)
- For a single user viewing one stock: **Sufficient with caching**
- For multiple users or frequent updates: **Requires aggressive caching**

### Example Usage Scenarios:

| Scenario                                          | Calls Needed | Feasible?                               |
| ------------------------------------------------- | ------------ | --------------------------------------- |
| User views 1 stock chart (1D, 5D, 1M, 3M, 6M, 1Y) | 1 call       | ✅ Yes (fetch once, filter client-side) |
| 10 users viewing different stocks simultaneously  | 10 calls     | ⚠️ Need caching (spread over time)      |
| Real-time chart updates every 5 seconds           | 12 calls/min | ❌ Exceeds limit                        |
| Real-time chart updates every 1 minute            | 1 call/min   | ✅ Yes                                  |
| Multiple stocks on dashboard                      | Varies       | ⚠️ Need caching + queuing               |

---

## 🎯 Strategies to Stay Within Free Tier

### 1. **Aggressive Caching** (Critical - Required)

Cache candle data aggressively to minimize API calls:

```typescript
// Cache strategy:
// - Cache daily candles for 24 hours
// - Cache hourly candles for 1 hour
// - Cache minute candles for 5 minutes
// - Use Next.js revalidate or Redis

const cacheKey = `candles:${symbol}:${resolution}:${from}:${to}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

// Fetch from Alpha Vantage
const data = await fetchAlphaVantageCandles(...);
await cache.set(cacheKey, data, { ttl: cacheTTL });
```

### 2. **Smart Data Fetching** (Essential)

- **Fetch larger time ranges** instead of multiple small ones

  - Instead of: 1D, 5D, 1M separately (3 calls) ❌
  - Fetch: 1 year of daily data (1 call) and filter client-side ✅

- **Use appropriate resolutions**
  - Daily charts: Use `D` resolution (1 call for 1 year)
  - Intraday: Use `60` (hourly) instead of `1` (minute) when possible
  - Avoid multiple resolution requests for the same symbol

### 3. **Client-Side Data Management** (Recommended)

Fetch once, transform multiple times:

```typescript
// Fetch 1 year of daily data once (1 API call)
const oneYearData = await fetch("/api/candles?symbol=AAPL&resolution=D");

// Transform client-side for different views (0 API calls)
const oneDayData = filterLastNDays(oneYearData, 1);
const fiveDayData = filterLastNDays(oneYearData, 5);
const oneMonthData = filterLastNDays(oneYearData, 30);
const threeMonthData = filterLastNDays(oneYearData, 90);
const sixMonthData = filterLastNDays(oneYearData, 180);
const oneYearData = oneYearData; // Already have it!
```

### 4. **Request Queuing** (Important for Multiple Users)

Implement request queuing to prevent exceeding 5 calls/minute:

```typescript
// Queue requests to stay under 5/minute
let requestQueue: Array<() => Promise<any>> = [];
let lastRequestTime = 0;
const MIN_TIME_BETWEEN_REQUESTS = 12000; // 12 seconds (5 calls/minute)

async function queuedRequest(fn: () => Promise<any>) {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      const timeSinceLastRequest = Date.now() - lastRequestTime;
      if (timeSinceLastRequest < MIN_TIME_BETWEEN_REQUESTS) {
        await new Promise((r) =>
          setTimeout(r, MIN_TIME_BETWEEN_REQUESTS - timeSinceLastRequest)
        );
      }
      lastRequestTime = Date.now();
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    // Process queue
    if (requestQueue.length === 1) {
      processQueue();
    }
  });
}

async function processQueue() {
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) await request();
  }
}
```

### 5. **Rate Limiting on Your Backend** (Recommended)

Implement rate limiting to prevent accidental bursts:

```typescript
// Use a rate limiter library
import rateLimit from "express-rate-limit";

const candleRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 4, // Allow 4 calls per minute (leave buffer for Alpha Vantage's 5/min limit)
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 6. **Lazy Loading & On-Demand Fetching**

If showing multiple stocks, consider:

- Fetching only when user actually views the chart
- Lazy loading charts (load on scroll/click)
- Pre-fetching only for popular stocks (with caching)
- Batch requests during off-peak times

---

## 🚀 Implementation Recommendations

### Option A: Next.js API Route Caching (Recommended - Already Implemented)

**Use Next.js built-in caching:**

```typescript
// app/api/candles/route.ts
import { NextResponse } from "next/server";
import {
  fetchAlphaVantageCandles,
  convertToCandleData,
} from "@/services/alphaVantage";

export async function GET(request: Request) {
  // ... validation code ...

  const candles = await fetchAlphaVantageCandles(
    symbol.toUpperCase(),
    resolution,
    from,
    to
  );

  // ... conversion and return ...
}

// Cache for 1 hour for daily/weekly/monthly data
// This helps stay within Alpha Vantage's rate limits
export const revalidate = 3600;
```

**Benefits:**

- ✅ Already implemented in your codebase
- ✅ Automatic caching per request
- ✅ Simple to use
- ✅ Good for MVP and small-medium apps

### Option B: Server-Side Caching with Redis (Best for Production)

**Backend caching layer:**

```python
# backend/cache_manager.py
from datetime import datetime, timedelta
import redis
import json

class CandleCache:
    def __init__(self):
        self.redis = redis.Redis(host='localhost', port=6379, db=0)

    def get_cache_key(self, symbol, resolution, from_time, to_time):
        return f"candles:{symbol}:{resolution}:{from_time}:{to_time}"

    def get_ttl(self, resolution):
        # Daily: cache 24 hours
        # Hourly: cache 1 hour
        # Minute: cache 5 minutes
        ttl_map = {
            'D': 86400,  # 24 hours
            'W': 86400,  # 24 hours
            'M': 86400,  # 24 hours
            '60': 3600,  # 1 hour
            '30': 1800,  # 30 minutes
            '15': 900,   # 15 minutes
            '5': 300,    # 5 minutes
            '1': 300,    # 5 minutes
        }
        return ttl_map.get(resolution, 3600)

    async def get_candles(self, symbol, resolution, from_time, to_time):
        cache_key = self.get_cache_key(symbol, resolution, from_time, to_time)

        # Check cache
        cached = self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Fetch from Alpha Vantage
        data = await fetch_from_alpha_vantage(...)

        # Cache it
        ttl = self.get_ttl(resolution)
        self.redis.setex(cache_key, ttl, json.dumps(data))

        return data
```

**Benefits:**

- ✅ More control over caching
- ✅ Shared cache across multiple instances
- ✅ Better for high-traffic applications
- ✅ Can implement more sophisticated caching strategies

### Option C: Client-Side Optimization (Use with Caching)

**Fetch once, transform multiple times:**

```typescript
// components/charts/StockPriceChart.tsx
const [candleData, setCandleData] = useState<CandleData | null>(null);

// Fetch 1 year of daily data once (1 API call)
useEffect(() => {
  const fetchData = async () => {
    // Single API call - get all data we need
    const response = await fetch(`/api/candles?symbol=${symbol}&resolution=D`);
    const { data } = await response.json();
    setCandleData(data);
  };
  fetchData();
}, [symbol]);

// Transform for different time ranges client-side (0 API calls)
const getFilteredData = (timeRange: string) => {
  if (!candleData) return null;

  const now = Date.now() / 1000;
  const ranges = {
    "1D": 86400,
    "5D": 432000,
    "1M": 2592000,
    "3M": 7776000,
    "6M": 15552000,
    "1Y": 31536000,
  };

  const cutoff = now - (ranges[timeRange] || 31536000);
  const filtered = candleData.t
    .map((timestamp, i) => ({
      time: timestamp,
      open: candleData.o[i],
      high: candleData.h[i],
      low: candleData.l[i],
      close: candleData.c[i],
      volume: candleData.v[i],
    }))
    .filter((candle) => candle.time >= cutoff);

  return filtered;
};
```

---

## ⚠️ What to Do If You Hit Limits

### If you exceed 5 calls/minute:

1. **Immediate Solutions:**

   - Implement/improve caching (see strategies above)
   - Add request queuing (see code example above)
   - Reduce update frequency for real-time charts
   - Fetch larger time ranges and filter client-side

2. **Monitor Usage:**

   ```typescript
   // Track API calls
   let callCount = 0;
   let resetTime = Date.now() + 60000;
   let dailyCallCount = 0;
   let dailyResetTime = Date.now() + 86400000; // 24 hours

   function canMakeCall(): boolean {
     const now = Date.now();

     // Reset daily counter if needed
     if (now > dailyResetTime) {
       dailyCallCount = 0;
       dailyResetTime = now + 86400000;
     }

     // Reset minute counter if needed
     if (now > resetTime) {
       callCount = 0;
       resetTime = now + 60000;
     }

     // Check limits
     if (callCount >= 5) return false; // 5 calls/minute limit
     if (dailyCallCount >= 500) return false; // 500 calls/day limit

     return true;
   }

   async function makeCall() {
     if (!canMakeCall()) {
       throw new Error("Rate limit exceeded");
     }
     callCount++;
     dailyCallCount++;
     // Make API call...
   }
   ```

3. **Upgrade Options (If Needed):**
   - **Alpha Vantage Premium**: $49.99/month → 75 calls/minute, 1200 calls/day
   - **Alpha Vantage Enterprise**: Custom pricing → Higher limits

---

## 📝 Recommended Implementation Plan

### Phase 1: Basic Implementation (Free Tier) ✅

1. ✅ Create `/api/candles` endpoint (using Alpha Vantage)
2. ✅ Implement Next.js caching (revalidate: 3600 for daily)
3. ✅ Fetch 1 year of daily data, filter client-side
4. ✅ Add error handling for rate limits

### Phase 2: Optimization (Recommended)

1. ⚠️ Add request queuing for multiple users
2. ⚠️ Implement rate limiting on API routes
3. ⚠️ Add Redis caching layer (if scaling)
4. ⚠️ Monitor API usage and daily limits
5. ⚠️ Implement fallback strategies

### Phase 3: Scale (If Growing)

1. ⚠️ Consider Alpha Vantage Premium plan
2. ⚠️ Implement multiple API keys (rotation)
3. ⚠️ Add more aggressive caching strategies
4. ⚠️ Consider hybrid approach (Alpha Vantage + other sources)

---

## 🔄 Hybrid Approach (Recommended)

Use **both** APIs strategically:

- **Finnhub** (free tier): Real-time quotes, news, company data, WebSocket
- **Alpha Vantage** (free tier): Historical candlestick data

This gives you the best of both worlds without paying for premium.

---

## ✅ Quick Start Checklist

- [x] Get Alpha Vantage API key (free)
- [x] Add `NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY` to `.env.local`
- [x] Create `services/alphaVantage.ts` file
- [x] Create `app/api/candles/route.ts` endpoint
- [ ] Test the endpoint: `/api/candles?symbol=AAPL&resolution=D`
- [ ] Implement client-side data filtering
- [ ] Add request queuing (if multiple users)
- [ ] Monitor API usage in development
- [ ] Test with multiple simultaneous users
- [ ] Integrate with chart component

---

## 🧪 Testing Your Implementation

### Test Rate Limiting:

```typescript
// Test script to check if you're within limits
async function testRateLimit() {
  const start = Date.now();
  let calls = 0;
  let successfulCalls = 0;

  for (let i = 0; i < 10; i++) {
    try {
      const response = await fetch("/api/candles?symbol=AAPL&resolution=D");
      if (response.ok) {
        successfulCalls++;
      }
      calls++;
      console.log(`Call ${i + 1}: ${response.ok ? "Success" : "Failed"}`);
    } catch (error) {
      console.log(`Call ${i + 1}: Error - ${error}`);
      break;
    }
    // Wait 12 seconds between calls (5 calls/minute = 1 call per 12 seconds)
    if (i < 9) {
      await new Promise((resolve) => setTimeout(resolve, 12000));
    }
  }

  const duration = (Date.now() - start) / 1000;
  console.log(`Made ${calls} calls in ${duration} seconds`);
  console.log(`Successful: ${successfulCalls}`);
  console.log(`Rate: ${(calls / duration) * 60} calls/minute`);
}
```

### Test Caching:

```typescript
// Test that caching works
async function testCaching() {
  const start1 = Date.now();
  const response1 = await fetch("/api/candles?symbol=AAPL&resolution=D");
  const duration1 = Date.now() - start1;
  console.log(`First call: ${duration1}ms`);

  // Immediate second call should be cached (much faster)
  const start2 = Date.now();
  const response2 = await fetch("/api/candles?symbol=AAPL&resolution=D");
  const duration2 = Date.now() - start2;
  console.log(`Second call (cached): ${duration2}ms`);

  if (duration2 < duration1 / 10) {
    console.log("✅ Caching is working!");
  } else {
    console.log("⚠️ Caching may not be working properly");
  }
}
```

---

## 📚 API Endpoint Reference

### Your Implementation:

**Endpoint:** `/api/candles`

**Query Parameters:**

- `symbol` (required): Stock symbol (e.g., "AAPL")
- `resolution` (optional): Time resolution (`1`, `5`, `15`, `30`, `60`, `D`, `W`, `M`)
- `from` (optional): Unix timestamp (start date)
- `to` (optional): Unix timestamp (end date)

**Example:**

```
GET /api/candles?symbol=AAPL&resolution=D
GET /api/candles?symbol=NVDA&resolution=60&from=1735689600&to=1735776000
```

**Response Format:**

```json
{
  "symbol": "AAPL",
  "resolution": "D",
  "data": {
    "c": [150.25, 151.30, ...],
    "h": [151.00, 152.00, ...],
    "l": [149.50, 150.00, ...],
    "o": [149.75, 150.50, ...],
    "t": [1735689600, 1735776000, ...],
    "v": [1234567, 2345678, ...],
    "s": "ok"
  }
}
```

---

## 🎯 Best Practices Summary

1. **Always cache** - Daily data for 24 hours minimum
2. **Fetch large ranges** - Get 1 year of daily data, filter client-side
3. **Queue requests** - If multiple users, implement request queuing
4. **Monitor usage** - Track calls/minute and calls/day
5. **Handle errors gracefully** - Rate limit errors should show user-friendly messages
6. **Use appropriate resolutions** - Don't fetch minute data if daily is sufficient
7. **Lazy load** - Only fetch when user actually needs the data

---

**Bottom Line**: Alpha Vantage's free tier is sufficient for most applications with proper caching and smart data fetching. The 5 calls/minute limit requires careful planning, but with aggressive caching and client-side filtering, you can build a great stock charting application without paying for premium access.
