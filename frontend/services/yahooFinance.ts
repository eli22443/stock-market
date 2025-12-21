import yahooFinance from "yahoo-finance2";
import { CandleData } from "@/types";

/**
 * Yahoo Finance candle data type
 */
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
 * Convert resolution code to Yahoo Finance interval
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
 * Fetch stock candles from Yahoo Finance
 * @param symbol Stock symbol (e.g., "AAPL")
 * @param resolution Time resolution ("1", "5", "15", "30", "60", "D", "W", "M")
 * @param from Optional Unix timestamp for start date
 * @param to Optional Unix timestamp for end date
 * @returns Array of candle data or null if error
 */
export async function fetchYahooFinanceCandles(
  symbol: string,
  resolution: string = "D",
  from?: number,
  to?: number
): Promise<YahooFinanceCandle[] | null> {
  try {
    const yh = new yahooFinance({ suppressNotices: ["yahooSurvey"] });
    const interval = getYahooInterval(resolution);

    // Convert Unix timestamps to Date objects
    // Default to 1 week ago if from not provided
    const period1 = from
      ? new Date(from * 1000)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const period2 = to ? new Date(to * 1000) : new Date();

    // Validate dates
    if (period1 > period2) {
      console.error("Invalid date range: period1 > period2");
      return null;
    }

    // Use chart module for intraday, historical module for daily/weekly/monthly
    // const isIntraday = ["1m", "5m", "15m", "30m", "1h"].includes(interval);

    let quote: YahooFinanceCandle[] = [];

    // Use chart module for intraday data and historical data (returns array format by default)
    const chartResult = await yh.chart(symbol, {
      period1,
      period2,
      interval: interval as
        | "1m"
        | "5m"
        | "15m"
        | "30m"
        | "1h"
        | "1d"
        | "1wk"
        | "1mo",
    });

    // Chart module returns ChartResultArray with quotes array
    if (chartResult?.quotes && Array.isArray(chartResult.quotes)) {
      quote = chartResult.quotes.map((item) => ({
        date: item.date,
        open: item.open ?? 0,
        high: item.high ?? 0,
        low: item.low ?? 0,
        close: item.close ?? 0,
        volume: item.volume ?? 0,
        adjClose: item.adjclose ?? undefined,
      }));
    }

    if (!quote || quote.length === 0) {
      console.warn(`No data found for symbol: ${symbol}`);
      return null;
    }

    // Ensure quote is an array
    const quoteArray = quote;

    // Convert to our format
    return quoteArray.map((item: any) => ({
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

    // Handle specific error types
    if (error instanceof Error) {
      // Check for invalid symbol errors
      if (
        error.message.includes("Invalid symbol") ||
        error.message.includes("not found")
      ) {
        console.error(`Invalid symbol: ${symbol}`);
        return null;
      }
    }

    return null;
  }
}

/**
 * Convert Yahoo Finance format to CandleData format
 * @param yahooData Array of Yahoo Finance candle data
 * @returns CandleData object compatible with existing types
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

  // Sort by date (ascending) to ensure chronological order
  const sortedData = [...yahooData].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  return {
    c: sortedData.map((d) => d.close),
    h: sortedData.map((d) => d.high),
    l: sortedData.map((d) => d.low),
    o: sortedData.map((d) => d.open),
    t: sortedData.map((d) => Math.floor(d.date.getTime() / 1000)),
    v: sortedData.map((d) => d.volume),
    s: "ok",
  };
}
