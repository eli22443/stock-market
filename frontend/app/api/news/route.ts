import { fetchYahooMarketNews } from "@/services/yahooFinance";
import { NextResponse } from "next/server";

// Cache for 5 minutes to reduce API calls (news doesn't change as frequently)
export const revalidate = 300;

export async function GET() {
  try {
    // Fetch market news
    const news = await fetchYahooMarketNews();
    if (!news) {
      // Return empty array instead of error to prevent crashes
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(news);
  } catch (error: any) {
    if (error?.message === "RATE_LIMITED" || error?.code === 429) {
      console.error("Rate limited - Yahoo Finance market news");
      // Return empty array when rate limited (app won't crash)
      return NextResponse.json([], { status: 200 });
    }
    console.error("Error fetching Yahoo Finance market news:", error);
    // Return empty array on error instead of error object
    return NextResponse.json([], { status: 200 });
  }
}
