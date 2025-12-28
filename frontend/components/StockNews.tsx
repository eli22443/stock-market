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
  // Filter number of news to show
  const newsCount = 10;

  const rendered_news = stockNews.slice(0, newsCount).map((news, index) => {
    const hasValidImage =
      news.image && news.image.trim() !== "" && news.image.startsWith("http");

    const img_rendered = hasValidImage ? (
      <img
        src={news.image}
        alt={news.headline}
        className="h-20 w-40 object-cover rounded"
      />
    ) : null;

    return (
      <div
        key={index}
        className={`flex justify-between border-gray-600 mb-6 pb-6 ${
          index % 2 == 0 ? "mr-6" : "ml-6"
        } ${
          index < newsCount - 2
            ? "border-b"
            : index % 2 != 0 && index == newsCount - 2 && "border-b"
        }`}
      >
        <div>
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold italic text-sm"
          >
            <h3>{news.headline}</h3>
          </a>
          <div className="footer text-xs pt-2">
            {new Date(news.datetime * 1000).toLocaleString()}
          </div>
        </div>
        {img_rendered}
      </div>
    );
  });

  return (
    <div className="relative mb-6">
      <div className="grid grid-cols-2">{rendered_news}</div>
      <div
        className={`absolute top-0 left-1/2 w-px bg-gray-600`}
        style={{ height: `${125 * Math.ceil(rendered_news.length / 2)}px` }}
      ></div>
      <div className={`relative -top-2 h-px bg-gray-600`}></div>
    </div>
  );
}
