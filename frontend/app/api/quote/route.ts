/**
 * Fetching company news and data for stocks.
 */
import { symbols, fetchStockData, fetchCompanyNews } from "@/app/api/route";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol || !symbols.includes(symbol)) {
      return NextResponse.json({ error: "Invalid symbol." }, { status: 400 });
    }

    const stockData = await fetchStockData(symbol);
    if (!stockData) {
      return NextResponse.json(
        { error: "Failed fetching stock data." },
        { status: 503 }
      );
    }

    const stockNews = await fetchCompanyNews(symbol);
    if (!stockNews) {
      return NextResponse.json(
        { error: "Failed fetching stock news." },
        { status: 503 }
      );
    }

    return NextResponse.json({ stockData, stockNews });
  } catch (error) {
    console.error("Error in GET /api/stocks:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
