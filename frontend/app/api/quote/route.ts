/**
 * Fetching company news and data for stocks and indices.
 * Uses Yahoo Finance for indices and as fallback for stocks.
 */
import {
  symbols,
  fetchStockData,
  fetchCompanyNews,
  fetchComprehensiveStockData,
} from "@/app/api/route";
import {
  fetchYahooComprehensiveData,
  type YahooComprehensiveData,
} from "@/services/yahooFinance";
import { NextResponse } from "next/server";
import type { ComprehensiveStockData, StockNewsRecord } from "@/types";

/**
 * Check if symbol is an index (starts with ^)
 */
function isIndex(symbol: string): boolean {
  return symbol.startsWith("^");
}

/**
 * Convert Yahoo Finance data to ComprehensiveStockData format
 */
function convertYahooToComprehensive(
  yahooData: YahooComprehensiveData
): ComprehensiveStockData {
  return {
    previousClose: yahooData.previousClose,
    open: yahooData.open,
    bid: yahooData.bid,
    bidSize: yahooData.bidSize,
    ask: yahooData.ask,
    askSize: yahooData.askSize,
    dayRange: yahooData.dayRange,
    week52Range: yahooData.week52Range,
    volume: yahooData.volume,
    avgVolume: yahooData.avgVolume,
    marketCap: yahooData.marketCap,
    beta: yahooData.beta,
    peRatio: yahooData.peRatio,
    eps: yahooData.eps,
    earningsDate: yahooData.earningsDate || "0",
    forwardDividend: yahooData.forwardDividend,
    forwardDividendYield: yahooData.forwardDividendYield,
    exDividendDate: yahooData.exDividendDate || "0",
    targetEstimate: yahooData.targetEstimate,
    currentPrice: yahooData.currentPrice,
    priceChange: yahooData.priceChange,
    priceChangePercent: yahooData.priceChangePercent,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const comprehensive = searchParams.get("comprehensive") === "true";

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required." },
        { status: 400 }
      );
    }

    const symbolUpper = symbol.toUpperCase();
    const isIndexSymbol = isIndex(symbolUpper);

    // For indices, always use Yahoo Finance
    // For stocks, validate against known symbols OR allow if it's a valid symbol format
    if (
      !isIndexSymbol &&
      symbols.length > 0 &&
      !symbols.includes(symbolUpper)
    ) {
      // Allow any symbol format (could be a valid stock not in our list)
      // We'll try to fetch it anyway
    }

    // Fetch comprehensive data if requested
    if (comprehensive) {
      let comprehensiveData: ComprehensiveStockData | null = null;
      let stockNews: StockNewsRecord[] = [];

      // For indices, use Yahoo Finance directly
      if (isIndexSymbol) {
        const yahooData = await fetchYahooComprehensiveData(symbolUpper);
        if (yahooData) {
          comprehensiveData = convertYahooToComprehensive(yahooData);
        }
        // Indices don't have company news, so leave stockNews empty
      } else {
        // For stocks, try Finnhub first, fallback to Yahoo Finance
        comprehensiveData = await fetchComprehensiveStockData(symbolUpper);

        // If Finnhub fails, try Yahoo Finance
        if (!comprehensiveData) {
          console.log(
            `Finnhub failed for ${symbolUpper}, trying Yahoo Finance...`
          );
          const yahooData = await fetchYahooComprehensiveData(symbolUpper);
          if (yahooData) {
            comprehensiveData = convertYahooToComprehensive(yahooData);
          }
        }

        // Try to fetch news (only for stocks, not indices)
        try {
          stockNews = (await fetchCompanyNews(symbolUpper)) || [];
        } catch (error) {
          console.error(`Error fetching news for ${symbolUpper}:`, error);
          stockNews = [];
        }
      }

      if (!comprehensiveData) {
        return NextResponse.json(
          { error: "Failed fetching comprehensive stock data." },
          { status: 503 }
        );
      }

      return NextResponse.json({
        stockData: comprehensiveData,
        stockNews: stockNews || [],
      });
    }

    // Default: fetch basic stock data
    let stockData = null;

    if (isIndexSymbol) {
      // For indices, use Yahoo Finance
      const yahooData = await fetchYahooComprehensiveData(symbolUpper);
      if (yahooData) {
        stockData = convertYahooToComprehensive(yahooData);
      }
    } else {
      // For stocks, try Finnhub first
      const finnhubData = await fetchStockData(symbolUpper);
      if (finnhubData) {
        // Convert to comprehensive format
        stockData = {
          previousClose: finnhubData.data.pc,
          open: finnhubData.data.o,
          dayRange: {
            low: finnhubData.data.l,
            high: finnhubData.data.h,
          },
          week52Range: {
            low: finnhubData.data.l,
            high: finnhubData.data.h,
          },
          currentPrice: finnhubData.data.c,
          priceChange: finnhubData.data.d,
          priceChangePercent: finnhubData.data.dp,
        } as ComprehensiveStockData;
      } else {
        // Fallback to Yahoo Finance
        const yahooData = await fetchYahooComprehensiveData(symbolUpper);
        if (yahooData) {
          stockData = convertYahooToComprehensive(yahooData);
        }
      }
    }

    if (!stockData) {
      return NextResponse.json(
        { error: "Failed fetching stock data." },
        { status: 503 }
      );
    }

    // Try to fetch news (only for stocks)
    let stockNews: StockNewsRecord[] = [];
    if (!isIndexSymbol) {
      try {
        stockNews = (await fetchCompanyNews(symbolUpper)) || [];
      } catch (error) {
        console.error(`Error fetching news for ${symbolUpper}:`, error);
        stockNews = [];
      }
    }

    return NextResponse.json({ stockData, stockNews });
  } catch (error) {
    console.error("Error in GET /api/quote:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
