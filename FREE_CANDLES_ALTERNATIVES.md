# Free Stock Candles API Alternatives

## ❌ Current Situation

**Finnhub Stock Candles** now requires **premium access** (not available on free tier). The `ERR_BAD_REQUEST` error confirms your free API key doesn't have access.

---

## ✅ Free Alternatives

### Option 1: Alpha Vantage (Recommended for Free Tier)

**Pros:**

- ✅ **Completely free** (with API key)
- ✅ Historical candlestick data
- ✅ 5 API calls per minute, 500 calls per day
- ✅ Good documentation
- ✅ Reliable and stable

**Cons:**

- ⚠️ Rate limited (5 calls/minute)
- ⚠️ Daily limit (500 calls/day)

**Get API Key:**

1. Go to https://www.alphavantage.co/support/#api-key
2. Fill out the form (free)
3. Get your API key instantly

**API Endpoint:**

```
https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=AAPL&interval=1min&apikey=YOUR_KEY
```

**Response Format:**

```json
{
  "Meta Data": {
    "1. Information": "Intraday (1min) open, high, low, close prices and volume",
    "2. Symbol": "AAPL",
    "3. Last Refreshed": "2025-01-27 16:00:00",
    "4. Interval": "1min",
    "5. Output Size": "Compact",
    "6. Time Zone": "US/Eastern"
  },
  "Time Series (1min)": {
    "2025-01-27 16:00:00": {
      "1. open": "150.0000",
      "2. high": "150.5000",
      "3. low": "149.8000",
      "4. close": "150.2000",
      "5. volume": "1234567"
    }
  }
}
```

---

### Option 2: Yahoo Finance (Unofficial - Free)

**Pros:**

- ✅ **Completely free** (no API key needed)
- ✅ No rate limits (but be respectful)
- ✅ Historical data available
- ✅ Multiple libraries available

**Cons:**

- ⚠️ Unofficial API (can break without notice)
- ⚠️ No official support
- ⚠️ May violate Yahoo's terms of service

**Libraries:**

- `yahoo-finance2` (Node.js/npm)
- `yfinance` (Python)

---

### Option 3: Polygon.io (Free Tier)

**Pros:**

- ✅ Free tier available
- ✅ Good for historical data
- ✅ 5 calls per minute

**Cons:**

- ⚠️ Limited historical data on free tier
- ⚠️ Requires credit card for some features

---

### Option 4: IEX Cloud (Free Tier)

**Pros:**

- ✅ Free tier: 50,000 messages/month
- ✅ Good documentation
- ✅ Reliable

**Cons:**

- ⚠️ Requires registration
- ⚠️ Limited to US stocks on free tier

---

## 🚀 Recommended Solution: Alpha Vantage

### Implementation Plan

#### Step 1: Get Alpha Vantage API Key

1. Visit: https://www.alphavantage.co/support/#api-key
2. Fill out the form
3. Copy your API key

#### Step 2: Add to Environment Variables

```bash
# frontend/.env.local
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_key_here  # Keep for other endpoints
```

#### Step 3: Create Alpha Vantage Service

```typescript
// frontend/services/alphaVantage.ts
import axios from "axios";

const ALPHA_VANTAGE_API_KEY =
  process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || "";
const BASE_URL = "https://www.alphavantage.co/query";

export type AlphaVantageCandleData = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
};

export type AlphaVantageResponse = {
  "Meta Data": {
    "1. Information": string;
    "2. Symbol": string;
    "3. Last Refreshed": string;
    "4. Interval": string;
    "5. Output Size": string;
    "6. Time Zone": string;
  };
  "Time Series (1min)"?: Record<
    string,
    {
      "1. open": string;
      "2. high": string;
      "3. low": string;
      "4. close": string;
      "5. volume": string;
    }
  >;
  "Time Series (5min)"?: Record<
    string,
    {
      "1. open": string;
      "2. high": string;
      "3. low": string;
      "4. close": string;
      "5. volume": string;
    }
  >;
  "Time Series (Daily)"?: Record<
    string,
    {
      "1. open": string;
      "2. high": string;
      "3. low": string;
      "4. close": string;
      "5. volume": string;
    }
  >;
  Note?: string; // Rate limit message
  "Error Message"?: string;
};

/**
 * Convert Alpha Vantage interval to their API format
 */
function getInterval(resolution: string): string {
  const intervalMap: Record<string, string> = {
    "1": "1min",
    "5": "5min",
    "15": "15min",
    "30": "30min",
    "60": "60min",
    D: "daily",
    W: "weekly",
    M: "monthly",
  };
  return intervalMap[resolution] || "daily";
}

/**
 * Fetch stock candles from Alpha Vantage
 */
export async function fetchAlphaVantageCandles(
  symbol: string,
  resolution: string = "D",
  from?: number,
  to?: number
): Promise<AlphaVantageCandleData[] | null> {
  try {
    if (!ALPHA_VANTAGE_API_KEY) {
      console.error("Alpha Vantage API key not found");
      return null;
    }

    const interval = getInterval(resolution);

    // Alpha Vantage uses different endpoints for intraday vs daily
    let url: string;
    if (
      interval === "daily" ||
      interval === "weekly" ||
      interval === "monthly"
    ) {
      url = `${BASE_URL}?function=TIME_SERIES_${interval.toUpperCase()}_ADJUSTED&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}&outputsize=full`;
    } else {
      url = `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${ALPHA_VANTAGE_API_KEY}&outputsize=full`;
    }

    const response = await axios.get<AlphaVantageResponse>(url);

    // Check for errors
    if (response.data["Error Message"]) {
      console.error("Alpha Vantage Error:", response.data["Error Message"]);
      return null;
    }

    // Check for rate limit
    if (response.data["Note"]) {
      console.warn("Alpha Vantage Rate Limit:", response.data["Note"]);
      return null;
    }

    // Extract time series data
    const timeSeriesKey = Object.keys(response.data).find((key) =>
      key.startsWith("Time Series")
    ) as keyof AlphaVantageResponse;

    if (!timeSeriesKey || !response.data[timeSeriesKey]) {
      console.error("No time series data found");
      return null;
    }

    const timeSeries = response.data[timeSeriesKey] as Record<
      string,
      {
        "1. open": string;
        "2. high": string;
        "3. low": string;
        "4. close": string;
        "5. volume": string;
      }
    >;

    // Convert to our format
    const candles: AlphaVantageCandleData[] = Object.entries(timeSeries)
      .map(([timestamp, data]) => {
        const date = new Date(timestamp);
        const unixTimestamp = Math.floor(date.getTime() / 1000);

        // Filter by date range if provided
        if (from && unixTimestamp < from) return null;
        if (to && unixTimestamp > to) return null;

        return {
          open: parseFloat(data["1. open"]),
          high: parseFloat(data["2. high"]),
          low: parseFloat(data["3. low"]),
          close: parseFloat(data["4. close"]),
          volume: parseInt(data["5. volume"]),
          timestamp: unixTimestamp,
        };
      })
      .filter((candle): candle is AlphaVantageCandleData => candle !== null)
      .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp

    return candles;
  } catch (error) {
    console.error("Error fetching Alpha Vantage candles:", error);
    return null;
  }
}

/**
 * Convert Alpha Vantage format to CandleData format (for compatibility)
 */
export function convertToCandleData(alphaData: AlphaVantageCandleData[]): {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  t: number[];
  v: number[];
  s: string;
} {
  return {
    c: alphaData.map((d) => d.close),
    h: alphaData.map((d) => d.high),
    l: alphaData.map((d) => d.low),
    o: alphaData.map((d) => d.open),
    t: alphaData.map((d) => d.timestamp),
    v: alphaData.map((d) => d.volume),
    s: "ok",
  };
}
```

#### Step 4: Create API Route

```typescript
// frontend/app/api/candles/route.ts
import { NextResponse } from "next/server";
import {
  fetchAlphaVantageCandles,
  convertToCandleData,
} from "@/services/alphaVantage";

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

    const candles = await fetchAlphaVantageCandles(
      symbol,
      resolution,
      from,
      to
    );

    if (!candles || candles.length === 0) {
      return NextResponse.json(
        { error: "No candle data found" },
        { status: 404 }
      );
    }

    // Convert to CandleData format for compatibility
    const candleData = convertToCandleData(candles);

    return NextResponse.json({
      symbol,
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

// Cache for 1 hour for daily data, 5 minutes for intraday
export const revalidate = 3600;
```

---

## 🔄 Hybrid Approach (Recommended)

Use **both** APIs strategically:

- **Finnhub** (free tier): Real-time quotes, news, company data
- **Alpha Vantage** (free tier): Historical candlestick data

This gives you the best of both worlds without paying for premium.

---

## 📊 Rate Limiting Strategy for Alpha Vantage

**Alpha Vantage Limits:**

- 5 API calls per minute
- 500 calls per day

**Strategies:**

1. **Aggressive Caching**

   ```typescript
   // Cache daily data for 24 hours
   // Cache intraday data for 5 minutes
   ```

2. **Fetch Larger Ranges**

   - Fetch 1 year of daily data (1 call)
   - Filter client-side for different views

3. **Request Queuing**

   ```typescript
   // Queue requests to stay under 5/minute
   let requestQueue: Array<() => Promise<any>> = [];
   let lastRequestTime = 0;

   async function queuedRequest(fn: () => Promise<any>) {
     const timeSinceLastRequest = Date.now() - lastRequestTime;
     if (timeSinceLastRequest < 12000) {
       // 12 seconds between requests
       await new Promise((resolve) =>
         setTimeout(resolve, 12000 - timeSinceLastRequest)
       );
     }
     lastRequestTime = Date.now();
     return fn();
   }
   ```

---

## 🧪 Testing the Implementation

```typescript
// Test Alpha Vantage connection
async function testAlphaVantage() {
  const candles = await fetchAlphaVantageCandles("AAPL", "D");
  console.log("Fetched candles:", candles?.length);
  console.log("First candle:", candles?.[0]);
  console.log("Last candle:", candles?.[candles.length - 1]);
}
```

---

## ✅ Quick Start Checklist

- [ ] Get Alpha Vantage API key (free)
- [ ] Add `NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY` to `.env.local`
- [ ] Create `services/alphaVantage.ts` file
- [ ] Create `app/api/candles/route.ts` endpoint
- [ ] Test the endpoint: `/api/candles?symbol=AAPL&resolution=D`
- [ ] Update chart components to use new endpoint

---

## 🎯 Next Steps

1. **Get Alpha Vantage API key** (takes 2 minutes)
2. **Implement the service** (I can help with this)
3. **Test it works**
4. **Integrate with your chart component**

Would you like me to implement the Alpha Vantage integration for you?
