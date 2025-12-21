# Alpha Vantage API Limitations & Solutions

## ⚠️ Critical Limitations Discovered

### 1. Intraday Data Requires Premium

**All intraday intervals require Alpha Vantage Premium:**

- ❌ 1 minute (`1`)
- ❌ 5 minutes (`5`)
- ❌ 15 minutes (`15`)
- ❌ 30 minutes (`30`)
- ❌ 60 minutes (`60`)

**Free tier does NOT support intraday data.**

### 2. Daily Data Limited to ~100 Data Points

**Free tier daily data limitations:**

- ✅ Daily data (`D`) is available on free tier
- ⚠️ Only returns **~100 data points** (~3 months of data)
- ❌ Full historical data requires Premium
- ✅ Weekly (`W`) and Monthly (`M`) data available

**What this means:**

- You can get ~3 months of daily data for free
- For longer historical data (1 year, 5 years), you need Premium
- `outputsize=compact` returns ~100 points (free)
- `outputsize=full` returns full history (premium)

---

## 🔧 Updated Implementation

### Code Changes Made

1. **Blocked intraday requests** - Returns error if user requests intraday data
2. **Changed to `outputsize=compact`** - Uses free tier limit (~100 data points)
3. **Added error messages** - Clear messages about premium requirements

### Current Supported Resolutions (Free Tier)

| Resolution    | Status  | Data Points | Time Range |
| ------------- | ------- | ----------- | ---------- |
| `D` (Daily)   | ✅ Free | ~100 points | ~3 months  |
| `W` (Weekly)  | ✅ Free | ~100 points | ~2 years   |
| `M` (Monthly) | ✅ Free | ~100 points | ~8 years   |

---

## 💡 Solutions & Alternatives

### Option 1: Use Alpha Vantage Free Tier (Current Implementation)

**Pros:**

- ✅ Already implemented
- ✅ Free
- ✅ Works for recent data (~3 months)

**Cons:**

- ❌ Limited to ~100 data points
- ❌ No intraday data
- ❌ No full historical data

**Best for:**

- Recent price charts (last 3 months)
- Weekly/monthly views
- MVP/prototype applications

---

### Option 2: Yahoo Finance (Unofficial - Free)

**Library:** `yahoo-finance2` (Node.js)

**Pros:**

- ✅ Completely free
- ✅ Full historical data
- ✅ Intraday data available
- ✅ No API key needed
- ✅ No rate limits (but be respectful)

**Cons:**

- ⚠️ Unofficial API (can break)
- ⚠️ No official support
- ⚠️ May violate Yahoo's ToS

**Installation:**

```bash
npm install yahoo-finance2
```

**Example:**

```typescript
import yahooFinance from "yahoo-finance2";

// Get daily historical data
const quote = await yahooFinance.historical("AAPL", {
  period1: "2020-01-01",
  period2: "2025-01-27",
  interval: "1d",
});

// Get intraday data
const intraday = await yahooFinance.historical("AAPL", {
  period1: Date.now() - 86400000, // 1 day ago
  period2: Date.now(),
  interval: "1m", // 1 minute
});
```

---

### Option 3: IEX Cloud (Free Tier)

**Pros:**

- ✅ Free tier: 50,000 messages/month
- ✅ Historical data available
- ✅ Good documentation
- ✅ Reliable

**Cons:**

- ⚠️ Requires registration
- ⚠️ Limited to US stocks on free tier
- ⚠️ Rate limited

**Get API Key:**

1. Visit: https://iexcloud.io/
2. Sign up for free account
3. Get API token

**Example:**

```typescript
// GET https://cloud.iexapis.com/stable/stock/AAPL/chart/1y?token=YOUR_TOKEN
const response = await fetch(
  `https://cloud.iexapis.com/stable/stock/${symbol}/chart/1y?token=${IEX_TOKEN}`
);
```

---

### Option 4: Polygon.io (Free Tier)

**Pros:**

- ✅ Free tier available
- ✅ Historical data
- ✅ 5 calls per minute

**Cons:**

- ⚠️ Limited historical data on free tier
- ⚠️ Requires credit card for some features

---

### Option 5: Hybrid Approach (Recommended)

**Use multiple sources strategically:**

1. **Alpha Vantage (Free)** - Recent daily data (~3 months)
2. **Yahoo Finance (Unofficial)** - Full historical + intraday data
3. **Finnhub (Free)** - Real-time quotes, news, WebSocket

**Implementation Strategy:**

```typescript
async function fetchCandles(symbol: string, resolution: string) {
  // For intraday: Use Yahoo Finance
  if (["1", "5", "15", "30", "60"].includes(resolution)) {
    return await fetchYahooFinanceCandles(symbol, resolution);
  }

  // For recent daily data: Use Alpha Vantage (free, cached)
  if (resolution === "D") {
    return await fetchAlphaVantageCandles(symbol, resolution);
  }

  // For full historical: Use Yahoo Finance
  return await fetchYahooFinanceCandles(symbol, resolution);
}
```

---

## 🚀 Recommended Solution: Yahoo Finance Integration

### Why Yahoo Finance?

1. **Free** - No API key needed
2. **Full historical data** - No 100-point limit
3. **Intraday data** - Supports all intervals
4. **Reliable** - Widely used library
5. **No rate limits** - (but be respectful)

### Implementation Plan

#### Step 1: Install Yahoo Finance Library

```bash
cd frontend
npm install yahoo-finance2
```

#### Step 2: Create Yahoo Finance Service

```typescript
// frontend/services/yahooFinance.ts
import yahooFinance from "yahoo-finance2";
import { CandleData } from "@/types";

export type YahooFinanceCandle = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
};

/**
 * Convert resolution to Yahoo Finance interval
 */
function getYahooInterval(resolution: string): string {
  const intervalMap: Record<string, string> = {
    "1": "1m", // 1 minute
    "5": "5m", // 5 minutes
    "15": "15m", // 15 minutes
    "30": "30m", // 30 minutes
    "60": "1h", // 1 hour
    D: "1d", // Daily
    W: "1wk", // Weekly
    M: "1mo", // Monthly
  };
  return intervalMap[resolution] || "1d";
}

/**
 * Fetch candles from Yahoo Finance
 */
export async function fetchYahooFinanceCandles(
  symbol: string,
  resolution: string = "D",
  from?: number,
  to?: number
): Promise<YahooFinanceCandle[] | null> {
  try {
    const interval = getYahooInterval(resolution);

    // Convert timestamps to dates
    const period1 = from
      ? new Date(from * 1000)
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Default: 1 year ago
    const period2 = to ? new Date(to * 1000) : new Date();

    const quote = await yahooFinance.historical(symbol, {
      period1,
      period2,
      interval: interval as any,
    });

    if (!quote || quote.length === 0) {
      return null;
    }

    return quote.map((item) => ({
      date: item.date,
      open: item.open ?? 0,
      high: item.high ?? 0,
      low: item.low ?? 0,
      close: item.close ?? 0,
      volume: item.volume ?? 0,
      adjClose: item.adjClose,
    }));
  } catch (error) {
    console.error("Error fetching Yahoo Finance candles:", error);
    return null;
  }
}

/**
 * Convert Yahoo Finance format to CandleData format
 */
export function convertYahooToCandleData(
  yahooData: YahooFinanceCandle[]
): CandleData {
  if (yahooData.length === 0) {
    return {
      c: [],
      h: [],
      l: [],
      o: [],
      t: [],
      v: [],
      s: "no_data",
    };
  }

  return {
    c: yahooData.map((d) => d.close),
    h: yahooData.map((d) => d.high),
    l: yahooData.map((d) => d.low),
    o: yahooData.map((d) => d.open),
    t: yahooData.map((d) => Math.floor(d.date.getTime() / 1000)),
    v: yahooData.map((d) => d.volume),
    s: "ok",
  };
}
```

#### Step 3: Update API Route to Use Yahoo Finance

```typescript
// frontend/app/api/candles/route.ts
import { NextResponse } from "next/server";
import {
  fetchYahooFinanceCandles,
  convertYahooToCandleData,
} from "@/services/yahooFinance";
import { CandleData } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const resolution = searchParams.get("resolution") || "D";
    const from = searchParams.get("from")
      ? parseInt(searchParams.get("from")!)
      : undefined;
    const to = searchParams.get("to")
      ? parseInt(searchParams.get("to")!)
      : undefined;

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    // Validate resolution
    const validResolutions = ["1", "5", "15", "30", "60", "D", "W", "M"];
    if (!validResolutions.includes(resolution)) {
      return NextResponse.json(
        {
          error: `Invalid resolution. Must be one of: ${validResolutions.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Fetch from Yahoo Finance (supports all resolutions)
    const candles = await fetchYahooFinanceCandles(
      symbol.toUpperCase(),
      resolution,
      from,
      to
    );

    if (!candles || candles.length === 0) {
      return NextResponse.json(
        {
          error: "No candle data found",
          symbol: symbol.toUpperCase(),
          resolution,
        },
        { status: 404 }
      );
    }

    // Convert to CandleData format
    const candleData: CandleData = convertYahooToCandleData(candles);

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      resolution,
      data: candleData,
    });
  } catch (error) {
    console.error("Error in GET /api/candles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Cache for 1 hour
export const revalidate = 3600;
```

---

## 📊 Comparison Table

| Feature            | Alpha Vantage (Free)       | Yahoo Finance        | IEX Cloud (Free)   |
| ------------------ | -------------------------- | -------------------- | ------------------ |
| **Daily Data**     | ✅ ~100 points (~3 months) | ✅ Full history      | ✅ Full history    |
| **Intraday Data**  | ❌ Premium only            | ✅ All intervals     | ✅ Available       |
| **Weekly/Monthly** | ✅ ~100 points             | ✅ Full history      | ✅ Available       |
| **API Key**        | ✅ Required (free)         | ❌ Not needed        | ✅ Required (free) |
| **Rate Limits**    | 5 calls/min, 500/day       | None (be respectful) | 50k/month          |
| **Reliability**    | ✅ Official                | ⚠️ Unofficial        | ✅ Official        |
| **Cost**           | Free                       | Free                 | Free               |

---

## ✅ Recommended Action Plan

1. **Keep Alpha Vantage** for basic daily data (recent 3 months)
2. **Add Yahoo Finance** for:
   - Intraday data (all intervals)
   - Full historical data (beyond 3 months)
3. **Update API route** to use Yahoo Finance as primary, Alpha Vantage as fallback
4. **Update documentation** to reflect new limitations

---

## 🎯 Next Steps

1. Install `yahoo-finance2`: `npm install yahoo-finance2`
2. Create `services/yahooFinance.ts` service
3. Update `app/api/candles/route.ts` to use Yahoo Finance
4. Test with different resolutions
5. Update chart components if needed

---

**Bottom Line**: Alpha Vantage free tier is too limited for a full-featured stock charting app. Yahoo Finance provides a better free solution with full historical and intraday data support.
