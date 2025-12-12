import MarketNews from "@/components/MarketNews";
import { MarketNewsRecord } from "@/types";

export default async function News() {
  const apiUrl = process.env.NEXT_URL
    ? `${process.env.NEXT_URL}/api/news`
    : "http://localhost:3000/api/news";

  const response = await fetch(apiUrl);
  const news: MarketNewsRecord[] = await response.json();

  return (
    <div className="news-page px-6">
      <h1 className="text-2xl font-bold mb-10">MARKET NEWS</h1>
      <MarketNews data={news} />
    </div>
  );
}
