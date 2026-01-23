/**
 * Table showing news of diffrent stocks.
 * Use inside /stocks page.
 */
import { StockNewsRecord } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

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
        className="h-16 h-20 w-24 w-40 object-cover rounded flex-shrink-0"
      />
    ) : null;

    return (
      <Card
        className="rounded"
        key={index}
      >
        <CardContent >
          <div className="flex flex-col flex-row justify-between gap-2 gap-4">
            <div className="flex-1 space-y-2 min-w-0">
              <CardTitle className="text-sm md:text-base">
                <a
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors line-clamp-2"
                >
                  {news.headline}
                </a>
              </CardTitle>
              <CardDescription className="text-xs">
                {new Date(news.datetime * 1000).toLocaleString()}
              </CardDescription>
            </div>
            {img_rendered && (
              <div className="flex-shrink-0">{img_rendered}</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:grid-cols-1 xl:grid-cols-2">
      {rendered_news}
    </div>
  );
}
