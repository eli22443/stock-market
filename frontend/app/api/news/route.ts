import { fetchYahooMarketNews } from "@/services/yahooFinance";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch maket news
    const news = await fetchYahooMarketNews();
    if (!news) {
      return NextResponse.json({ error: "Failed fetching news.", status: 503 });
    }
    return NextResponse.json(news);
  } catch (error) {
    console.error("Error in GET /api/news:", error);
    return NextResponse.json({ error: "Internal server error", status: 500 });
  }
}
