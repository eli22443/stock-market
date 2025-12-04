/**
 * Fetching company news and data for stocks.
 */
import axios from "axios";
import type { StockNews } from "@/types";
import { symbols, API_KEY, BASE_URL } from "@/app/api/route";
import { NextResponse } from "next/server";

export const fetchCompanyNews = async (
  symbol: string
): Promise<StockNews[] | null> => {
  try {
    console.log("Sending request to external API...");
    const response = await axios.get<StockNews[]>(
      `${BASE_URL}/company-news?symbol=${symbol}&from=2025-11-15&to=2025-11-20&token=${API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error("Error in fetching data from external API.", error);
    return null;
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol || !symbols.includes(symbol)) {
      return NextResponse.json({ error: "Invalid symbol." }, { status: 400 });
    }

    const news = await fetchCompanyNews(symbol);

    if (!news) {
      return NextResponse.json(
        { error: "Failed fetching news." },
        { status: 500 }
      );
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error("Error in GET /api/stocks:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
