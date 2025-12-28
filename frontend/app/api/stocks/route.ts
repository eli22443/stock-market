import { NextResponse } from "next/server";
import { fetchStockData, fetchMultiStocksData } from "@/app/api/route";
import { fetchYahooComprehensiveData } from "@/services/yahooFinance";
import { symbols } from "@/app/api/route";
import type { StockCategorized, StockRecord, StocksMetrics, ComprehensiveData } from "@/types";

const categories = ["most-active", "trending", "gainers", "losers"];

/**
 * Fetch stock data for a single symbol
 */
/**
 * Fetch all stocks data
 */
/**
 * Calculate price change percentage
 */
function calculateChangePercent(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate price range (high - low) as a proxy for activity/volatility
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
 * Categorize stocks into different categories using comprehensive data
 */
async function categorizeStocksWithComprehensiveData(
  stockSymbols: string[]
): Promise<StocksMetrics[]> {
  // Fetch comprehensive data for all stocks in parallel
  const comprehensiveDataPromises = stockSymbols.map((symbol) =>
    fetchYahooComprehensiveData(symbol)
  );
  const comprehensiveDataArray = await Promise.all(comprehensiveDataPromises);

  // Convert comprehensive data to StocksMetrics format
  const stocksWithMetrics: StocksMetrics[] = comprehensiveDataArray
    .filter((data): data is ComprehensiveData => data !== null)
    .map((data) => {
      // Convert to QuoteData format for backward compatibility
      const quoteData = {
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
        symbol: data.symbol,
        name: data.name,
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
    });

  return stocksWithMetrics;
}

/**
 * Categorize stocks into different categories (legacy function for backward compatibility)
 */
function categorizeStocks(stocks: StockRecord[]) {
  // Add calculated fields to each stock
  const stocksWithMetrics: StocksMetrics[] = stocks.map((stock) => ({
    symbol: stock.symbol,
    name: stock.name,
    data: stock.data,
    changePercent: calculateChangePercent(stock.data.c, stock.data.pc),
    priceRange: calculatePriceRange(stock.data.h, stock.data.l),
    priceChange: stock.data.c - stock.data.pc,
  }));

  // Gainers: stocks with highest positive percentage change
  const gainers = [...stocksWithMetrics]
    .filter((stock) => stock.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 10); // Top 10 gainers

  // Losers: stocks with highest negative percentage change (most negative)
  const losers = [...stocksWithMetrics]
    .filter((stock) => stock.changePercent < 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 10); // Top 10 losers

  // Most Active: stocks with highest price range (volatility proxy)
  // In a real app, you'd use volume data, but we'll use price range as a proxy
  const mostActive = [...stocksWithMetrics]
    .sort((a, b) => b.priceRange - a.priceRange)
    .slice(0, 10); // Top 10 most active

  // Trending: stocks with significant price movement (either direction)
  // Using absolute change percentage
  const trending = [...stocksWithMetrics]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 10); // Top 10 trending

  return {
    gainers,
    losers,
    mostActive,
    trending,
  };
}

/**
 * GET /api/stocks
 * Returns stocks categorized by: most-active, trending, gainers, losers
 *
 * Query parameters:
 * - category: filter by specific category (optional)
 *   - "most-active" | "trending" | "gainers" | "losers"
 */
export async function GET(request: Request) {
  // console.log("GET /api/stocks called");
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json({
        error: "Failed fetching category.",
        status: 503,
      });
    }

    if (!categories.includes(category)) {
      return NextResponse.json({
        error: `Invalid category. Must be one of: ${categories.join(", ")}`,
        status: 400,
      });
    }

    // Fetch comprehensive data for all stocks
    const stockSymbols = symbols.slice(0, 10); // Limit to 10 stocks for performance
    const stocksWithMetrics = await categorizeStocksWithComprehensiveData(stockSymbols);

    if (stocksWithMetrics.length === 0) {
      return NextResponse.json({
        error: "No stock data available",
        status: 503,
      });
    }

    // Categorize stocks
    // Gainers: stocks with highest positive percentage change
    const gainers = [...stocksWithMetrics]
      .filter((stock) => stock.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 10);

    // Losers: stocks with highest negative percentage change (most negative)
    const losers = [...stocksWithMetrics]
      .filter((stock) => stock.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 10);

    // Most Active: stocks with highest volume
    const mostActive = [...stocksWithMetrics]
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 10);

    // Trending: stocks with significant price movement (either direction)
    // Using absolute change percentage
    const trending = [...stocksWithMetrics]
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 10);

    const categorized = {
      gainers,
      losers,
      mostActive,
      trending,
    };

    const categoryKey = category === "most-active" ? "mostActive" : category;
    const stockCat: StockCategorized = {
      category,
      stocks: categorized[categoryKey as keyof typeof categorized],
      count: categorized[categoryKey as keyof typeof categorized].length,
    };
    return NextResponse.json(stockCat);
  } catch (error) {
    console.error("Error in GET /api/stocks:", error);
    return NextResponse.json({ error: "Internal server error", status: 500 });
  }
}

// /**
//  * POST /api/stocks
//  * For future use - could accept stock symbols to fetch
//  */
// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { symbols: customSymbols } = body;

//     if (!customSymbols || !Array.isArray(customSymbols)) {
//       return NextResponse.json(
//         { error: "Please provide an array of stock symbols" },
//         { status: 400 }
//       );
//     }

//     // Fetch stocks for provided symbols
//     const stockPromises = customSymbols.map((symbol: string) =>
//       fetchStockData(symbol.toUpperCase())
//     );
//     const stocks = await Promise.all(stockPromises);
//     const validStocks = stocks.filter(
//       (stock): stock is StockRecord => stock !== null
//     );

//     return NextResponse.json({
//       stocks: validStocks,
//       count: validStocks.length,
//     });
//   } catch (error) {
//     console.error("Error in POST /api/stocks:", error);
//     return NextResponse.json({ error: "Internal server error", status: 500 });
//   }
// }
