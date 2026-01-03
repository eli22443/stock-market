/**
 * Component displaying market news articles.
 * Shows general market news (not specific to a stock).
 */
import { MarketNewsRecord } from "@/types";

export default function MarketNews({ data }: { data: MarketNewsRecord[] }) {
  // Ensure data is an array and handle empty/undefined cases
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="mx-10 text-center text-gray-500">
        <p>No market news available at the moment.</p>
        <p className="text-sm mt-2">Please try again later.</p>
      </div>
    );
  }

  const renderedNews = data.slice(0, 9).map((news, index) => {
    const yahooPic =
      "https://s.yimg.com/rz/stage/p/yahoo_finance_en-US_h_p_finance_2.png";

    // Check if image exists and is not the placeholder
    const hasValidImage =
      news.image &&
      news.image.trim() !== "" &&
      news.image !== yahooPic &&
      news.image.startsWith("http");

    const imgRendered = hasValidImage ? (
      <img
        src={news.image}
        alt={news.headline}
        className="h-40 w-80 object-cover rounded mb-2"
      />
    ) : null;

    return (
      <div key={index} className="mb-30">
        <a
          href={news.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold italic"
        >
          {news.headline}
        </a>
        {imgRendered}
        <p>{news.summary}</p>
      </div>
    );
  });

  return (
    <div className="mx-10">
      <div className="">{renderedNews}</div>
    </div>
  );
}
