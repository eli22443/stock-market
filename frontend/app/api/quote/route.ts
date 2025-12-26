/**
 * Fetching company news and data for stocks and indices.
 * Uses Yahoo Finance for all data fetching.
 */
import {
  fetchYahooComprehensiveData,
  fetchYahooCompanyNews,
} from "@/services/yahooFinance";
import { NextResponse } from "next/server";

/**
 * Check if symbol is an index (starts with ^)
 */
function isIndex(symbol: string): boolean {
  return symbol.startsWith("^");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol")?.toUpperCase();

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required." },
        { status: 400 }
      );
    }

    const comprehensiveData = await fetchYahooComprehensiveData(symbol);

    if (!comprehensiveData) {
      return NextResponse.json(
        { error: "Failed fetching comprehensive stock data." },
        { status: 503 }
      );
    }

    const stockNews = (await fetchYahooCompanyNews(symbol)) || [];

    return NextResponse.json({
      stockData: comprehensiveData,
      stockNews: stockNews,
    });
  } catch (error) {
    console.error("Error in GET /api/quote:", error);
    return NextResponse.json({ error: "Internal server error.", status: 500 });
  }
}
