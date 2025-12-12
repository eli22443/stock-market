import StockList from "@/components/StockList";
import NewsTable from "@/components/StockNews";
import { StockNewsRecord, ComprehensiveStockData } from "@/types";
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
    ? `${process.env.NEXT_URL}/api/quote?symbol=${symbol}&comprehensive=true`
    : `http://localhost:3000/api/quote?symbol=${symbol}&comprehensive=true`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    console.log(await response.json());
    notFound();
  }

  const {
    stockData,
    stockNews,
  }: { stockData: ComprehensiveStockData; stockNews: StockNewsRecord[] } =
    await response.json();

  if (!stockData) {
    notFound();
  }

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="stock-page px-6">
      <h2 className="text-2xl font-bold my-5">
        {symbol.toUpperCase()} Stock Data
      </h2>

      {/* Current Price & Change */}
      <div className="border hover:border-indigo-900 rounded-lg px-6 py-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Current Price</div>
            <div className="text-3xl font-bold ">
              {formatNumber(stockData.currentPrice)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Change</div>
            <div
              className={`text-2xl font-semibold ${
                stockData.priceChange >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {stockData.priceChange >= 0 ? "+" : ""}
              {formatNumber(stockData.priceChange)}(
              {stockData.priceChangePercent >= 0 ? "+" : ""}
              {formatNumber(stockData.priceChangePercent)}%)
            </div>
          </div>
        </div>
      </div>

      {/* stock graph */}
      <div className="stock-graph h-75 border mx-2">STOCK GRAPH</div>

      <StockList data={stockData} symbol={symbol} />
      <div className="mt-8">
        <h2 className="text-2xl font-bold mt-10 mb-5">Company News</h2>
        <NewsTable symbol={symbol} stockNews={stockNews} />
      </div>
    </div>
  );
}
