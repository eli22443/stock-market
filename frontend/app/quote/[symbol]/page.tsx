import { fetchCompanyNews, fetchStockData } from "@/services/api";
import { notFound } from "next/navigation";

export default async function QuotePage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  // Validate symbol exists by fetching stock data first
  const stockData = await fetchStockData(symbol.toUpperCase());
  if (!stockData) {
    notFound();
  }

  const stock_news = await fetchCompanyNews(symbol.toUpperCase());

  if (!stock_news || stock_news.length === 0) {
    return (
      <div>
        <h1 className="mb-10">{symbol.toUpperCase()} page:</h1>
        <p>No news available for this stock.</p>
      </div>
    );
  }

  const rendered_news = stock_news.slice(83, 95).map((news, index) => {
    const yahoo_pic =
      "https://s.yimg.com/rz/stage/p/yahoo_finance_en-US_h_p_finance_2.png";

    // Check if image exists and is not the placeholder
    const hasValidImage =
      news.image &&
      news.image.trim() !== "" &&
      news.image !== yahoo_pic &&
      news.image.startsWith("http");

    const img_rendered = hasValidImage ? (
      <img
        src={news.image}
        alt={news.headline}
        className="h-40 w-80 object-cover rounded mb-2"
      />
    ) : null;

    // console.log("News item:", { headline: news.headline, image: news.image });

    return (
      <div key={index} className="mb-30">
        <h1 className="font-bold italic">{news.headline}</h1>
        {img_rendered}
        <p>{news.summary}</p>
      </div>
    );
  });

  return (
    <div>
      <h1 className="mb-10">{symbol.toUpperCase()} page:</h1>
      <h1 className="mb-5">COMPANY NEWS:</h1>
      <div className="">{rendered_news}</div>
    </div>
  );
}
