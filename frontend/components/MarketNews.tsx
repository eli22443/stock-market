/**
 * Component displaying market news articles.
 * Shows general market news (not specific to a stock).
 */
import { MarketNewsRecord } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export default function MarketNews({ data }: { data: MarketNewsRecord[] }) {
  // Ensure data is an array and handle empty/undefined cases
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card className="mx-10">
        <CardContent >
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">No market news available at the moment.</p>
            <p className="text-sm text-muted-foreground">Please try again later.</p>
          </div>
        </CardContent>
      </Card>
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
      <Card key={index} className="mb-6 hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg">
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              {news.headline}
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {imgRendered}
          <CardDescription className="text-base">{news.summary}</CardDescription>
        </CardContent>
      </Card>
    );
  });

  return (
    <div className="mx-2 space-y-4">
      {renderedNews}
    </div>
  );
}
