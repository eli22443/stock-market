import { NextResponse } from "next/server";
import { cache } from "react";
import { type QuoteData, type StockRecord } from "@/types";
import { fetchYahooComprehensiveData } from "@/services/yahooFinance";
export const symbols = [
  "NVDA",
  "AAPL",
  "GOOGL",
  "MSFT",
  "AMZN",
  "META",
  "NFLX",
  "TSLA",
  "AMD",
  "INTC",
  "IBM",
  "ORCL",
  "CRM",
  "ADBE",
  "PYPL",
  "UBER",
  "BABA",
  "SHOP",
  "SQ",
  "BAC",
];

// Cache the multi-stock fetch to deduplicate requests across components
export const fetchStockData = cache(
  async (symbol: string): Promise<StockRecord | null> => {
    try {
      const yahooData = await fetchYahooComprehensiveData(symbol);
      if (!yahooData) {
        return null;
      }

      // Convert Yahoo Finance data to QuoteData format for backward compatibility
      const quoteData: QuoteData = {
        c: yahooData.currentPrice,
        d: yahooData.priceChange,
        dp: yahooData.priceChangePercent,
        h: yahooData.dayRange.high,
        l: yahooData.dayRange.low,
        o: yahooData.open,
        pc: yahooData.previousClose,
        t: Math.floor(Date.now() / 1000),
      };

      return { symbol, data: quoteData };
    } catch (error) {
      console.error("Error in fetching data.", error);
      return null;
    }
  }
);

// Cache the multi-stock fetch to deduplicate requests across components
export const fetchMultiStocksData = cache(async (): Promise<StockRecord[]> => {
  // Fetch stocks sequentially with delays to avoid rate limiting
  const stockSymbols = symbols.slice(0, 5);
  const multiData: (StockRecord | null)[] = [];

  for (let i = 0; i < stockSymbols.length; i++) {
    const symbol = stockSymbols[i];
    try {
      const stock = await fetchStockData(symbol);
      multiData.push(stock);
      // Add delay between requests (except for last one)
      if (i < stockSymbols.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error: any) {
      if (error?.message === "RATE_LIMITED") {
        console.error("Rate limited - stopping further requests");
        break; // Stop if rate limited
      }
      console.error(`Error fetching ${symbol}:`, error);
      multiData.push(null);
    }
  }

  // Filter out null values (invalid symbols)
  return multiData.filter((stock): stock is StockRecord => stock !== null);
});

// Cache for 60 seconds to reduce API calls
export const revalidate = 60;

export async function GET() {
  try {
    const allStocks = await fetchMultiStocksData();
    if (allStocks.length === 0) {
      return NextResponse.json(
        { error: "No stock data available" },
        { status: 503 }
      );
    }
    return NextResponse.json(allStocks);
  } catch (error) {
    console.error("Error in GET /api:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
