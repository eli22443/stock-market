import MarketNews from "@/components/MarketNews";
import { MarketNewsRecord } from "@/types";

// Force dynamic rendering for real-time news data
export const dynamic = 'force-dynamic';

export default async function News() {
  let news: MarketNewsRecord[] = [];

  try {
    const apiUrl = process.env.NEXT_URL
      ? `${process.env.NEXT_URL}/api/news`
      : "http://localhost:3000/api/news";

    const response = await fetch(apiUrl, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error fetching news:", errorData);
      // Use empty array as fallback
      news = [];
    } else {
      const jsonData = await response.json();
      // Ensure we have an array, not an error object
      if (Array.isArray(jsonData)) {
        news = jsonData;
      } else {
        console.error("API returned non-array data:", jsonData);
        news = [];
      }
    }
  } catch (error) {
    // Handle fetch errors (e.g., during build when server isn't running)
    console.error("Error fetching news:", error);
    news = [];
  }

  return (
    <div className="news-page py-4 sm:py-6 pb-20 lg:pb-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Market News</h1>
      <MarketNews data={news} />
    </div>
  );
}
