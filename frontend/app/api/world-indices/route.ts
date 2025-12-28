import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";
import { fetchYahooComprehensiveData } from "@/services/yahooFinance";
import type { QuoteData, StocksMetrics, ComprehensiveData } from "@/types";

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
 * Calculate 52-week change percentage
 */
function calculate52WeekChangePercent(
  currentPrice: number,
  week52Low: number,
  week52High: number
): number {
  if (week52Low === 0 || week52High === 0) return 0;
  // Calculate change from 52-week low
  const changeFromLow = ((currentPrice - week52Low) / week52Low) * 100;
  return changeFromLow;
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

    // Convert Yahoo Finance quote to QuoteData format
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
    // Fetch comprehensive data for all indices in parallel
    const comprehensiveDataPromises = worldIndicesSymbols.map(({ symbol }) =>
      fetchYahooComprehensiveData(symbol)
    );
    const comprehensiveDataArray = await Promise.all(comprehensiveDataPromises);

    // Filter out null results and convert to StocksMetrics format
    const indicesWithMetrics: (StocksMetrics & { name: string })[] = comprehensiveDataArray
      .map((data, index) => {
        if (!data) return null;
        const { symbol, name } = worldIndicesSymbols[index];

        // Convert to QuoteData format for backward compatibility
        const quoteData: QuoteData = {
          c: data.currentPrice,
          d: data.priceChange,
          dp: data.priceChangePercent,
          h: data.dayRange.high,
          l: data.dayRange.low,
          o: data.open,
          pc: data.previousClose,
          t: Math.floor(Date.now() / 1000),
        };

        // Calculate 52-week change percentage
        const week52ChangePercent = calculate52WeekChangePercent(
          data.currentPrice,
          data.week52Range.low,
          data.week52Range.high
        );

        return {
          symbol,
          name,
          data: quoteData,
          changePercent: data.priceChangePercent,
          priceRange: calculatePriceRange(data.dayRange.high, data.dayRange.low),
          priceChange: data.priceChange,
          volume: data.volume,
          avgVolume: data.avgVolume,
          marketCap: data.marketCap,
          peRatio: data.peRatio,
          week52ChangePercent,
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
