# Yahoo Finance 2 Implementation Plan

## 🎯 Overview

This plan outlines the complete implementation of `yahoo-finance2` to replace Alpha Vantage for stock candle data. Yahoo Finance provides free access to full historical and intraday data without API keys or rate limits.

---

## ✅ Why Yahoo Finance 2?

### Advantages:

- ✅ **Completely free** - No API key needed
- ✅ **Full historical data** - No 100-point limit
- ✅ **Intraday data** - All intervals supported (1m, 5m, 15m, 30m, 1h)
- ✅ **Daily/Weekly/Monthly** - Full history available
- ✅ **No rate limits** - (but be respectful)
- ✅ **Widely used** - Popular, well-maintained library
- ✅ **TypeScript support** - Good type definitions

### Considerations:

- ⚠️ **Unofficial API** - Can break if Yahoo changes their API
- ⚠️ **No official support** - Community-maintained
- ⚠️ **May violate ToS** - Use at your own risk
- ⚠️ **Server-side only** - Cannot be used in browser/client components

---

## 📋 Implementation Steps

### Phase 1: Setup & Installation

#### Step 1.1: Install Package

```bash
cd frontend
npm install yahoo-finance2
```

#### Step 1.2: Verify Installation

Check `package.json` to confirm `yahoo-finance2` is added to dependencies.

---

### Phase 2: Create Yahoo Finance Service

#### Step 2.1: Create Service File

**File:** `frontend/services/yahooFinance.ts`

**Purpose:** Centralized service for fetching stock candles from Yahoo Finance

**Key Features:**

- Convert resolution codes to Yahoo Finance intervals
- Handle date range conversions
- Convert Yahoo Finance format to our `CandleData` type
- Error handling and validation

#### Step 2.2: Implementation Details

**Resolution Mapping:**

- `1` → `1m` (1 minute)
- `5` → `5m` (5 minutes)
- `15` → `15m` (15 minutes)
- `30` → `30m` (30 minutes)
- `60` → `1h` (1 hour)
- `D` → `1d` (daily)
- `W` → `1wk` (weekly)
- `M` → `1mo` (monthly)

**Date Handling:**

- Accept Unix timestamps (`from`, `to`)
- Convert to JavaScript `Date` objects
- Default to 1 year ago if `from` not provided
- Default to now if `to` not provided

**Data Conversion:**

- Yahoo Finance returns array of objects with `date`, `open`, `high`, `low`, `close`, `volume`
- Convert to our `CandleData` format: `{ c, h, l, o, t, v, s }`

---

### Phase 3: Update API Route

#### Step 3.1: Update `/api/candles/route.ts`

**Changes:**

- Remove Alpha Vantage imports
- Import Yahoo Finance service
- Remove intraday blocking (Yahoo Finance supports all intervals)
- Implement Yahoo Finance fetching
- Keep error handling and validation

#### Step 3.2: API Route Features

**Query Parameters:**

- `symbol` (required): Stock symbol (e.g., "AAPL")
- `resolution` (optional): Time resolution (`1`, `5`, `15`, `30`, `60`, `D`, `W`, `M`)
- `from` (optional): Unix timestamp (start date)
- `to` (optional): Unix timestamp (end date)

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

### Phase 4: Testing

#### Step 4.1: Unit Tests

Test the service functions:

- Resolution conversion
- Date handling
- Data format conversion
- Error handling

#### Step 4.2: Integration Tests

Test API endpoint:

- Valid requests (all resolutions)
- Invalid symbols
- Date range filtering
- Error responses

#### Step 4.3: Manual Testing

Test in browser/Postman:

```bash
# Daily data
GET /api/candles?symbol=AAPL&resolution=D

# Intraday data (1 minute)
GET /api/candles?symbol=AAPL&resolution=1

# With date range
GET /api/candles?symbol=AAPL&resolution=D&from=1735689600&to=1735776000

# Weekly data
GET /api/candles?symbol=AAPL&resolution=W
```

---

### Phase 5: Error Handling & Edge Cases

#### Step 5.1: Handle Common Errors

- **Invalid symbol**: Return 404 with clear message
- **No data available**: Return 404
- **Date range issues**: Validate dates, handle invalid ranges
- **Yahoo Finance API errors**: Catch and return user-friendly errors

#### Step 5.2: Edge Cases

- **Empty results**: Handle gracefully
- **Missing fields**: Use defaults (0 for prices, 0 for volume)
- **Future dates**: Clamp to current date
- **Very old dates**: Yahoo Finance may not have data

---

### Phase 6: Caching Strategy

#### Step 6.1: Next.js Caching

Use Next.js built-in caching:

```typescript
export const revalidate = 3600; // 1 hour
```

#### Step 6.2: Cache Strategy by Resolution

- **Daily/Weekly/Monthly**: Cache for 24 hours (data doesn't change often)
- **Intraday (1h, 30m)**: Cache for 15 minutes
- **Intraday (15m, 5m, 1m)**: Cache for 5 minutes

#### Step 6.3: Consider Redis (Optional)

For production, consider Redis caching:

- Shared cache across instances
- More control over TTL
- Better for high-traffic scenarios

---

## 📝 Code Structure

### Service File Structure

```typescript
// frontend/services/yahooFinance.ts

// Types
export type YahooFinanceCandle = { ... }

// Helper Functions
function getYahooInterval(resolution: string): string { ... }
function convertYahooToCandleData(data: YahooFinanceCandle[]): CandleData { ... }

// Main Function
export async function fetchYahooFinanceCandles(
  symbol: string,
  resolution: string,
  from?: number,
  to?: number
): Promise<YahooFinanceCandle[] | null> { ... }
```

### API Route Structure

```typescript
// frontend/app/api/candles/route.ts

export async function GET(request: Request) {
  // 1. Parse query parameters
  // 2. Validate inputs
  // 3. Call Yahoo Finance service
  // 4. Convert to CandleData format
  // 5. Return response
}
```

---

## 🔍 Implementation Checklist

### Setup

- [ ] Install `yahoo-finance2` package
- [ ] Verify installation in `package.json`

### Service Implementation

- [ ] Create `frontend/services/yahooFinance.ts`
- [ ] Implement resolution mapping function
- [ ] Implement date conversion logic
- [ ] Implement `fetchYahooFinanceCandles` function
- [ ] Implement `convertYahooToCandleData` function
- [ ] Add error handling
- [ ] Add TypeScript types

### API Route

- [ ] Update `frontend/app/api/candles/route.ts`
- [ ] Remove Alpha Vantage imports
- [ ] Add Yahoo Finance imports
- [ ] Remove intraday blocking
- [ ] Implement Yahoo Finance fetching
- [ ] Update error messages
- [ ] Test all resolutions

### Testing

- [ ] Test daily data (`D`)
- [ ] Test weekly data (`W`)
- [ ] Test monthly data (`M`)
- [ ] Test intraday data (`1`, `5`, `15`, `30`, `60`)
- [ ] Test with date ranges
- [ ] Test invalid symbols
- [ ] Test error handling

### Documentation

- [ ] Update API documentation
- [ ] Update README if needed
- [ ] Document limitations/considerations

---

## 🚨 Important Notes

### Server-Side Only

**Yahoo Finance 2 can ONLY be used server-side:**

- ✅ Works in API routes (`app/api/`)
- ✅ Works in Server Components
- ❌ **Cannot** be used in Client Components
- ❌ **Cannot** be used in browser

**Why?** Yahoo Finance uses Node.js-specific modules that don't work in browsers.

### Rate Limiting

While Yahoo Finance has no official rate limits:

- **Be respectful** - Don't make excessive requests
- **Use caching** - Cache responses to reduce requests
- **Consider delays** - Add small delays if making many requests

### Data Availability

- **Intraday data**: Usually available for last 1-2 months
- **Daily data**: Available for many years (depends on stock)
- **Some stocks**: May have limited historical data

---

## 📊 Expected Data Ranges

| Resolution         | Typical Data Range | Notes                  |
| ------------------ | ------------------ | ---------------------- |
| `1m` (1 minute)    | Last 1-2 months    | Intraday data limited  |
| `5m` (5 minutes)   | Last 1-2 months    | Intraday data limited  |
| `15m` (15 minutes) | Last 1-2 months    | Intraday data limited  |
| `30m` (30 minutes) | Last 1-2 months    | Intraday data limited  |
| `1h` (1 hour)      | Last 1-2 months    | Intraday data limited  |
| `1d` (daily)       | Many years         | Full history available |
| `1wk` (weekly)     | Many years         | Full history available |
| `1mo` (monthly)    | Many years         | Full history available |

---

## 🎯 Success Criteria

Implementation is complete when:

1. ✅ All resolutions work (`1`, `5`, `15`, `30`, `60`, `D`, `W`, `M`)
2. ✅ Date range filtering works
3. ✅ Error handling is robust
4. ✅ Data format matches `CandleData` type
5. ✅ Caching is implemented
6. ✅ API route returns correct responses
7. ✅ No Alpha Vantage code remains

---

## 🔄 Migration Notes

### Removed:

- ❌ Alpha Vantage service (`services/alphaVantage.ts`)
- ❌ Alpha Vantage API key requirement
- ❌ Intraday blocking logic
- ❌ Alpha Vantage-specific error messages

### Added:

- ✅ Yahoo Finance service (`services/yahooFinance.ts`)
- ✅ Support for all resolutions
- ✅ Full historical data access
- ✅ Intraday data support

---

## 📚 Resources

- **Yahoo Finance 2 Docs**: https://github.com/gadicc/node-yahoo-finance2
- **NPM Package**: https://www.npmjs.com/package/yahoo-finance2
- **TypeScript Types**: Included in package

---

## 🚀 Quick Start After Implementation

Once implemented, test with:

```bash
# Start dev server
npm run dev

# Test daily data
curl http://localhost:3000/api/candles?symbol=AAPL&resolution=D

# Test intraday data
curl http://localhost:3000/api/candles?symbol=AAPL&resolution=1

# Test with date range
curl "http://localhost:3000/api/candles?symbol=AAPL&resolution=D&from=1735689600&to=1735776000"
```

---

**Ready to implement?** Follow the checklist above step by step!
