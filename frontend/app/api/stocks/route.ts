import { NextResponse } from "next/server";
import { fetchStockData, fetchMultiStocksData } from "@/app/api/route";
import type { StockRecord, StocksMetrics } from "@/types";

const categories = ["most-active", "trending", "gainers", "losers"];

// type stocksCategorized = {
//   gainers: StocksMetrics[];
//   losers: StocksMetrics[];
//   mostActive: StocksMetrics[];
//   trending: StocksMetrics[];
// };

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
 * Categorize stocks into different categories
 */
function categorizeStocks(stocks: StockRecord[]) {
  // Add calculated fields to each stock
  const stocksWithMetrics: StocksMetrics[] = stocks.map((stock) => ({
    ...stock,
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

    // Fetch all stocks
    const allStocks = await fetchMultiStocksData();

    if (allStocks.length === 0) {
      return NextResponse.json(
        { error: "No stock data available" },
        { status: 503 }
      );
    }

    // Categorize stocks
    const categorized = categorizeStocks(allStocks);

    // If a specific category is requested, return only that category
    if (category) {
      if (!categories.includes(category)) {
        return NextResponse.json(
          {
            error: `Invalid category. Must be one of: ${categories.join(", ")}`,
          },
          { status: 400 }
        );
      }

      const categoryKey = category === "most-active" ? "mostActive" : category;
      return NextResponse.json({
        category,
        stocks: categorized[categoryKey as keyof typeof categorized],
        count: categorized[categoryKey as keyof typeof categorized].length,
      });
    }

    // Return all categories
    return NextResponse.json({
      categories: {
        "most-active": {
          stocks: categorized.mostActive,
          count: categorized.mostActive.length,
        },
        trending: {
          stocks: categorized.trending,
          count: categorized.trending.length,
        },
        gainers: {
          stocks: categorized.gainers,
          count: categorized.gainers.length,
        },
        losers: {
          stocks: categorized.losers,
          count: categorized.losers.length,
        },
      },
      totalStocks: allStocks.length,
    });
  } catch (error) {
    console.error("Error in GET /api/stocks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stocks
 * For future use - could accept stock symbols to fetch
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { symbols: customSymbols } = body;

    if (!customSymbols || !Array.isArray(customSymbols)) {
      return NextResponse.json(
        { error: "Please provide an array of stock symbols" },
        { status: 400 }
      );
    }

    // Fetch stocks for provided symbols
    const stockPromises = customSymbols.map((symbol: string) =>
      fetchStockData(symbol.toUpperCase())
    );
    const stocks = await Promise.all(stockPromises);
    const validStocks = stocks.filter(
      (stock): stock is StockRecord => stock !== null
    );

    return NextResponse.json({
      stocks: validStocks,
      count: validStocks.length,
    });
  } catch (error) {
    console.error("Error in POST /api/stocks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
