# Quick Setup Guide: Alpha Vantage for Stock Candles

## ✅ Solution Implemented!

I've created a complete Alpha Vantage integration to replace Finnhub's premium-only candles endpoint.

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Alpha Vantage API Key (Free)

1. Go to: https://www.alphavantage.co/support/#api-key
2. Fill out the form (name, email, organization)
3. Click "GET FREE API KEY"
4. Copy your API key (starts with something like `ABC123...`)

**Time: 2 minutes**

---

### Step 2: Add API Key to Environment Variables

Create or edit `frontend/.env.local`:

```bash
# Add your Alpha Vantage API key
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here

# Keep your existing Finnhub key for other endpoints
NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_key_here
```

**Important:**

- The file should be named `.env.local` (not `.env`)
- Restart your Next.js dev server after adding the key

---

### Step 3: Test the API

Start your dev server and test:

```bash
cd frontend
npm run dev
```

Then visit or test:

```
http://localhost:3000/api/candles?symbol=AAPL&resolution=D
```

You should see JSON response with candle data!

---

## 📝 What Was Created

1. **`frontend/services/alphaVantage.ts`**

   - Service to fetch candles from Alpha Vantage
   - Converts Alpha Vantage format to your `CandleData` type
   - Handles errors and rate limits

2. **`frontend/app/api/candles/route.ts`**

   - API endpoint: `/api/candles?symbol=AAPL&resolution=D`
   - Compatible with your existing `CandleData` type
   - Includes caching to stay within rate limits

3. **Updated files:**
   - Removed deprecated Finnhub candles test function
   - Updated documentation

---

## 🎯 Usage Examples

### In Your Components

```typescript
// Fetch daily candles for AAPL
const response = await fetch("/api/candles?symbol=AAPL&resolution=D");
const { data } = await response.json();
// data is in CandleData format: { c, h, l, o, t, v, s }

// Fetch 1-minute candles
const response = await fetch("/api/candles?symbol=AAPL&resolution=1");

// Fetch with date range
const from = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
const to = Math.floor(Date.now() / 1000);
const response = await fetch(
  `/api/candles?symbol=AAPL&resolution=D&from=${from}&to=${to}`
);
```

### Supported Resolutions

- `1` - 1 minute
- `5` - 5 minutes
- `15` - 15 minutes
- `30` - 30 minutes
- `60` - 60 minutes (1 hour)
- `D` - Daily (default)
- `W` - Weekly
- `M` - Monthly

---

## ⚠️ Rate Limits

**Alpha Vantage Free Tier:**

- 5 API calls per minute
- 500 calls per day

**Strategies to stay within limits:**

1. **Caching is already implemented** - Daily data cached for 1 hour
2. **Fetch larger ranges** - Get 1 year of daily data, filter client-side
3. **Don't poll too frequently** - For real-time updates, use your existing WebSocket

---

## 🧪 Testing

### Test in Browser Console

```javascript
// Test the endpoint
fetch("/api/candles?symbol=AAPL&resolution=D")
  .then((r) => r.json())
  .then((data) => console.log("Candles:", data));
```

### Test in Your Code

```typescript
// In a component or API route
import { fetchAlphaVantageCandles } from "@/services/alphaVantage";

const candles = await fetchAlphaVantageCandles("AAPL", "D");
console.log("Fetched", candles?.length, "candles");
```

---

## 🔍 Troubleshooting

### Error: "Alpha Vantage API key not found"

- Make sure you created `.env.local` (not `.env`)
- Make sure the variable name is exactly: `NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY`
- Restart your Next.js dev server

### Error: "No candle data found"

- Check that the symbol is valid (e.g., "AAPL" not "apple")
- Alpha Vantage may have rate limited you (wait 1 minute)
- Check browser console for detailed error messages

### Rate Limit Error

- You've exceeded 5 calls/minute
- Wait 1 minute and try again
- Implement more aggressive caching if needed

---

## ✅ Next Steps

1. **Get your API key** (Step 1 above)
2. **Add to `.env.local`** (Step 2 above)
3. **Test the endpoint** (Step 3 above)
4. **Integrate with your chart component** (see `GRAPH_IMPLEMENTATION_PLAN.md`)

---

## 📚 Files Reference

- **Service**: `frontend/services/alphaVantage.ts`
- **API Route**: `frontend/app/api/candles/route.ts`
- **Documentation**: `FREE_CANDLES_ALTERNATIVES.md`
- **Chart Plan**: `GRAPH_IMPLEMENTATION_PLAN.md`

---

**Ready to use!** Once you add your API key, the `/api/candles` endpoint will work and you can start building your charts! 🎉
