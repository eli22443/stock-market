# Graph/Chart Implementation Plan for Stock Market App

## Overview

This plan outlines how to implement interactive stock charts/graphs in your Next.js stock market application. You currently have a placeholder for a stock graph on the quote page and have `CandleData` types defined.

---

## 1. Chart Library Selection

### Selected: **Chart.js with react-chartjs-2**

**Packages**: `react-chartjs-2` + `chart.js`

**Why Chart.js:**

- ✅ Very popular, extensive community support
- ✅ Many chart types (candlestick, line, bar, etc.)
- ✅ Good documentation and examples
- ✅ React integration via react-chartjs-2
- ✅ Responsive and customizable
- ✅ Active maintenance and updates

**Installation:**

```bash
cd frontend
npm install chart.js react-chartjs-2
```

**Note**: Chart.js doesn't have native candlestick support, but we can use a candlestick plugin or create custom candlestick visualization using bar charts.

---

## 2. Implementation Steps

> **Note**: Stock Candles API uses **Yahoo Finance** (free, no API key needed). See `YAHOO_FINANCE_IMPLEMENTATION_PLAN.md` for details. The API endpoint is already implemented at `/api/candles`.

### Phase 1: Setup & Installation

1. **Install chart library**

   ```bash
   cd frontend
   npm install chart.js react-chartjs-2
   ```

2. **Create chart component structure**
   ```
   frontend/components/
   ├── charts/
   │   ├── StockPriceChart.tsx      # Main candlestick/line chart
   │   ├── VolumeChart.tsx          # Volume bar chart
   │   ├── PriceChart.tsx           # Simple line chart (alternative)
   │   └── ChartContainer.tsx       # Wrapper with controls
   ```

### Phase 2: API Integration

1. **API endpoint is already implemented** ✅

   - File: `frontend/app/api/candles/route.ts`
   - Uses Yahoo Finance via `yahoo-finance2` library
   - Supports all resolutions: `1`, `5`, `15`, `30`, `60`, `D`, `W`, `M`
   - Supports date ranges via `from` and `to` query parameters

2. **API Usage Example**

   ```typescript
   // Fetch daily data
   const response = await fetch("/api/candles?symbol=AAPL&resolution=D");
   const { data } = await response.json();

   // Fetch with date range
   const from = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
   const to = Math.floor(Date.now() / 1000);
   const response = await fetch(
     `/api/candles?symbol=AAPL&resolution=D&from=${from}&to=${to}`
   );
   ```

### Phase 3: Chart Component Development

1. **Main Stock Price Chart Component**

   - Accept `CandleData` prop
   - Support multiple chart types: Candlestick, Line, Area
   - Time period selector: 1D, 5D, 1M, 3M, 6M, 1Y, 5Y
   - Resolution selector: 1min, 5min, 15min, 30min, 1hr, Daily, Weekly
   - Real-time updates via WebSocket integration

2. **Volume Chart Component**

   - Display volume bars below price chart
   - Color-coded (green/red) based on price direction

3. **Chart Controls**
   - Time period buttons
   - Chart type toggle (Candlestick/Line/Area)
   - Zoom controls
   - Crosshair/price display on hover

### Phase 4: Real-time Integration

1. **WebSocket Integration**

   - Connect to existing WebSocket context
   - Update chart with real-time price updates
   - Append new candles as they arrive
   - Handle reconnection gracefully

2. **Data Management**
   - Cache historical data
   - Merge real-time updates with historical data
   - Handle data gaps and missing candles

### Phase 5: Additional Features

1. **Technical Indicators** (Optional)

   - Moving averages (SMA, EMA)
   - Volume indicators
   - RSI, MACD (if using a library that supports them)

2. **Chart Annotations**

   - Mark earnings dates
   - Mark news events
   - Price alerts

3. **Multiple Chart Views**
   - Comparison charts (multiple stocks)
   - Sector performance charts
   - Market overview charts

---

## 3. Data Structure & API Design

### Candle Data API Endpoint

**Route**: `/api/candles?symbol=AAPL&resolution=D&from=1234567890&to=1234567890`

**Response**:

```typescript
{
  symbol: string;
  resolution: string;
  data: CandleData;
}
```

### Chart Component Props

```typescript
interface StockPriceChartProps {
  symbol: string;
  initialData?: CandleData;
  timeRange?: "1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "5Y";
  resolution?: "1" | "5" | "15" | "30" | "60" | "D" | "W" | "M";
  chartType?: "candlestick" | "line" | "area";
  showVolume?: boolean;
  realTime?: boolean;
}
```

---

## 4. Implementation Priority

### High Priority (MVP)

1. ✅ Install chart.js and react-chartjs-2
2. ✅ Create basic line chart component
3. ✅ API endpoint for candle data (already implemented with Yahoo Finance)
4. ✅ Integrate chart into quote page
5. ✅ Add time period selector (1D, 5D, 1M, 3M, 6M, 1Y)

### Medium Priority

6. ⚠️ Add volume chart below price chart
7. ⚠️ Add chart type toggle (line/area)
8. ⚠️ Implement candlestick chart (custom or plugin)
9. ⚠️ Add resolution selector
10. ⚠️ Add real-time WebSocket updates

### Low Priority (Nice to Have)

11. ⚠️ Technical indicators (moving averages)
12. ⚠️ Chart annotations (earnings, news)
13. ⚠️ Comparison charts (multiple stocks)
14. ⚠️ Export chart as image
15. ⚠️ Chart zoom and pan controls

---

## 5. Code Structure Example

### Chart Component Structure (Chart.js)

```typescript
// components/charts/StockPriceChart.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { CandleData } from "@/types";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StockPriceChartProps {
  symbol: string;
  data: CandleData;
  chartType?: "candlestick" | "line" | "area";
  // ... other props
}

export default function StockPriceChart({
  symbol,
  data,
  chartType = "line",
}: StockPriceChartProps) {
  // Convert CandleData to Chart.js format
  const chartData = {
    labels: data.t.map((timestamp) =>
      new Date(timestamp * 1000).toLocaleDateString()
    ),
    datasets: [
      {
        label: "Price",
        data: data.c, // Close prices
        borderColor: "rgb(59, 130, 246)",
        backgroundColor:
          chartType === "area" ? "rgba(59, 130, 246, 0.1)" : "transparent",
        fill: chartType === "area",
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `${symbol} Stock Price`,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="h-[500px] w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
```

### Candlestick Chart (Custom Implementation)

For candlestick charts with Chart.js, you'll need to create a custom visualization:

```typescript
// components/charts/CandlestickChart.tsx
"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { CandleData } from "@/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// Custom plugin for candlestick visualization
const candlestickPlugin = {
  id: "candlestick",
  // Implementation for drawing candlesticks
};

export default function CandlestickChart({
  symbol,
  data,
}: {
  symbol: string;
  data: CandleData;
}) {
  // Convert to candlestick format
  // Each candle needs: open, high, low, close
  const chartData = {
    labels: data.t.map((t) => new Date(t * 1000).toLocaleDateString()),
    datasets: [
      {
        label: "Candles",
        data: data.t.map((_, i) => ({
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
        })),
        // Custom rendering for candlesticks
      },
    ],
  };

  return <Bar data={chartData} plugins={[candlestickPlugin]} />;
}
```

### API Route Structure (Already Implemented)

```typescript
// app/api/candles/route.ts (✅ Already implemented)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const resolution = searchParams.get("resolution") || "D";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Uses Yahoo Finance via yahoo-finance2
  // Returns CandleData format
}
```

---

## 6. Testing Checklist

- [ ] Chart renders with historical data
- [ ] Time period selector updates chart
- [ ] Chart type toggle works
- [ ] Real-time updates appear correctly
- [ ] Chart is responsive on mobile
- [ ] Handles missing/empty data gracefully
- [ ] Performance is good with large datasets (1000+ candles)
- [ ] WebSocket reconnection doesn't break chart

---

## 7. Resources & Documentation

- **Chart.js**: https://www.chartjs.org/
- **React Chart.js 2**: https://react-chartjs-2.js.org/
- **Yahoo Finance 2**: https://github.com/gadicc/node-yahoo-finance2
- **Chart.js Candlestick Plugin**: https://www.npmjs.com/package/chartjs-chart-financial (optional)
- **Chart.js Examples**: https://www.chartjs.org/docs/latest/samples/

---

## 8. Next Steps

1. ✅ **API endpoint implemented** - Using Yahoo Finance
2. ⚠️ **Install Chart.js dependencies** - `npm install chart.js react-chartjs-2`
3. ⚠️ **Build basic line chart component** - Start with simple price line chart
4. ⚠️ **Integrate into quote page** - Replace placeholder with chart component
5. ⚠️ **Add time period selector** - Buttons for 1D, 5D, 1M, 3M, 6M, 1Y
6. ⚠️ **Add volume chart** - Display volume bars below price chart
7. ⚠️ **Implement candlestick chart** - Use custom rendering or plugin
8. ⚠️ **Add controls and real-time updates** - WebSocket integration

---

## 9. Chart.js Specific Considerations

### Candlestick Charts with Chart.js

Chart.js doesn't have native candlestick support. Options:

1. **Use chartjs-chart-financial plugin** (Recommended)

   ```bash
   npm install chartjs-chart-financial
   ```

   - Provides candlestick chart type
   - Well-maintained and documented

2. **Custom candlestick rendering**

   - Use bar charts with custom styling
   - More control but more complex

3. **Use line chart with OHLC bars**
   - Simpler but less visually accurate

### Data Format for Chart.js

```typescript
// Convert CandleData to Chart.js format
const chartData = {
  labels: data.t.map((timestamp) =>
    new Date(timestamp * 1000).toLocaleDateString()
  ),
  datasets: [
    {
      label: "Close Price",
      data: data.c,
      borderColor: "rgb(59, 130, 246)",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
    },
  ],
};
```

### Volume Chart Example

```typescript
const volumeData = {
  labels: data.t.map((t) => new Date(t * 1000).toLocaleDateString()),
  datasets: [
    {
      label: "Volume",
      data: data.v,
      backgroundColor: data.c.map((close, i) =>
        close >= data.o[i] ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)"
      ),
    },
  ],
};
```

---

## 10. Questions to Consider

1. ✅ **Chart library decided**: Chart.js with react-chartjs-2
2. ✅ **Data source decided**: Yahoo Finance (free, no API key)
3. ⚠️ Do you want candlestick charts, line charts, or both?
4. ⚠️ What time ranges are most important? (1D, 1M, 1Y?)
5. ⚠️ Do you need intraday charts (1min, 5min) or just daily/weekly?
6. ⚠️ Should charts update in real-time via WebSocket?
7. ⚠️ Do you want to show volume charts?
8. ⚠️ Any specific styling requirements (dark mode, colors)?

---

**Ready to start?** The API is ready! Next step is installing Chart.js and building the chart component.
