/**
 * Table showing news of diffrent stocks.
 * Use inside /stocks page.
 */
import { StockNewsRecord } from "@/types";

export default function StockNews({
  symbol,
  stockNews,
}: {
  symbol: string;
  stockNews: StockNewsRecord[];
}) {
  const rendered_news = stockNews.slice(83, 95).map((news, index) => {
    const yahoo_pic =
      "https://s.yimg.com/rz/stage/p/yahoo_finance_en-US_h_p_finance_2.png";

    // Check if image exists and is not the placeholder
    const hasValidImage =
      news.image &&
      news.image.trim() !== "" &&
      // news.image !== yahoo_pic &&
      news.image.startsWith("http");

    const img_rendered = hasValidImage ? (
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
        {img_rendered}
        <p>{news.summary}</p>
      </div>
    );
  });

  return (
    <div className="mx-10">
      <div className="">{rendered_news}</div>
    </div>
  );
}
