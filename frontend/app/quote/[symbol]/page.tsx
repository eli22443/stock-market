import NewsTable from "@/components/NewsTable";
import { fetchCompanyNews } from "@/app/api/quote/route";
import { StockNews } from "@/types";
import { notFound } from "next/navigation";

/**
 * The main page of a stock.
 * Hhow stock graph, table data, news, stats...
 */

export default async function QuotePage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  // Validate symbol exists by fetching stock data first
  // const stockData = await fetchStockData(symbol.toUpperCase());
  // if (!stockData) {
  //   notFound();
  // }

  // const stockNews: StockNews[] | null = await fetchCompanyNews(
  //   symbol.toUpperCase()
  // );
  const apiUrl = process.env.NEXT_URL
    ? `${process.env.NEXT_URL}/api/quote?symbol=${symbol}`
    : `http://localhost:3000/api/quote?symbol=${symbol}`;

  const response = await fetch(apiUrl);

  const stockNews: StockNews[] = await response.json();

  if (stockNews.length == 0) {
    return (
      <div>
        <h1 className="mb-10">{symbol.toUpperCase()} page:</h1>
        <p>No news available for this stock.</p>
      </div>
    );
  }

  return <NewsTable symbol={symbol} stockNews={stockNews} />;
}
