import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";
import type { QuoteData, StocksMetrics } from "@/types";

/**
 * Common world indices symbols
 * Note: Yahoo Finance uses ^ prefix for indices
 */
export const worldIndicesSymbols = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^RUT", name: "Russell 2000" },
  { symbol: "^VIX", name: "CBOE Volatility" },
  { symbol: "^FTSE", name: "FTSE 100" },
  { symbol: "^N225", name: "Nikkei 225" },
  { symbol: "^HSI", name: "Hang Seng" },
  { symbol: "^GDAXI", name: "DAX" },
  { symbol: "^FCHI", name: "CAC 40" },
  { symbol: "^STOXX50E", name: "EURO STOXX 50" },
  { symbol: "^AEX", name: "AEX Index" },
];

/**
 * Calculate price change percentage
 */
function calculateChangePercent(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate price range (high - low)
 */
function calculatePriceRange(high: number, low: number): number {
  return high - low;
}

/**
 * Fetch index quote data from Yahoo Finance
 */
async function fetchIndexQuote(symbol: string): Promise<QuoteData | null> {
  try {
    const yh = new yahooFinance({ suppressNotices: ["yahooSurvey"] });
    const quote = await yh.quote(symbol);

    if (!quote || !quote.regularMarketPrice) {
      return null;
    }

    // Convert Yahoo Finance quote to Finnhub QuoteData format
    const quoteData: QuoteData = {
      c: quote.regularMarketPrice, // current price
      d: quote.regularMarketChange || 0, // change
      dp: quote.regularMarketChangePercent || 0, // percent change
      h: quote.regularMarketDayHigh || quote.regularMarketPrice, // high
      l: quote.regularMarketDayLow || quote.regularMarketPrice, // low
      o: quote.regularMarketOpen || quote.regularMarketPrice, // open
      pc: quote.regularMarketPreviousClose || quote.regularMarketPrice, // previous close
      t: quote.regularMarketTime
        ? Math.floor(new Date(quote.regularMarketTime).getTime() / 1000)
        : Math.floor(Date.now() / 1000), // time
    };

    return quoteData;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * GET /api/world-indices
 * Returns data for major world stock indices using Yahoo Finance (free)
 */
export async function GET() {
  try {
    // Fetch all indices data in parallel
    const indicesPromises = worldIndicesSymbols.map(({ symbol }) =>
      fetchIndexQuote(symbol)
    );
    const indicesData = await Promise.all(indicesPromises);

    // Filter out null results and add calculated metrics
    const indicesWithMetrics: (StocksMetrics & { name: string })[] = indicesData
      .map((data, index) => {
        if (!data) return null;
        const { symbol, name } = worldIndicesSymbols[index];
        return {
          symbol,
          data,
          name,
          changePercent: calculateChangePercent(data.c, data.pc),
          priceRange: calculatePriceRange(data.h, data.l),
          priceChange: data.c - data.pc,
        };
      })
      .filter(
        (index): index is StocksMetrics & { name: string } => index !== null
      );

    return NextResponse.json({
      indices: indicesWithMetrics,
      count: indicesWithMetrics.length,
    });
  } catch (error) {
    console.error("Error in GET /api/world-indices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
