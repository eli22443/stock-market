import { ComprehensiveStockData } from "@/types";

interface StockListProps {
  data: ComprehensiveStockData;
  symbol: string;
}

export default function StockList({ data, symbol }: StockListProps) {
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatLargeNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString("en-US");
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="comprehensive-stock-data space-y-6">
      <h2 className="text-2xl font-bold mb-10">
        {symbol.toUpperCase()} Stock Data
      </h2>

      {/* Current Price & Change */}
      <div className="border hover:border-indigo-950 p-6 rounded-lg ">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Current Price</div>
            <div className="text-3xl font-bold ">
              {formatNumber(data.currentPrice)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Change</div>
            <div
              className={`text-2xl font-semibold ${
                data.priceChange >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {data.priceChange >= 0 ? "+" : ""}
              {formatNumber(data.priceChange)}(
              {data.priceChangePercent >= 0 ? "+" : ""}
              {formatNumber(data.priceChangePercent)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Price Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="border hover:border-indigo-950 p-4 rounded">
          <div className="text-sm text-gray-600 mb-1">Previous Close</div>
          <div className="text-lg font-semibold">
            {formatNumber(data.previousClose)}
          </div>
        </div>

        <div className="border hover:border-indigo-950 p-4 rounded">
          <div className="text-sm text-gray-600 mb-1">Open</div>
          <div className="text-lg font-semibold">{formatNumber(data.open)}</div>
        </div>

        {data.bid && (
          <div className="border hover:border-indigo-950 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">Bid</div>
            <div className="text-lg font-semibold">
              {formatNumber(data.bid)}
              {data.bidSize && (
                <span className="text-sm text-gray-500"> x {data.bidSize}</span>
              )}
            </div>
          </div>
        )}

        {data.ask && (
          <div className="border hover:border-indigo-950 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">Ask</div>
            <div className="text-lg font-semibold">
              {formatNumber(data.ask)}
              {data.askSize && (
                <span className="text-sm text-gray-500"> x {data.askSize}</span>
              )}
            </div>
          </div>
        )}

        <div className="border hover:border-indigo-950 p-4 rounded">
          <div className="text-sm text-gray-600 mb-1">Day&apos;s Range</div>
          <div className="text-lg font-semibold">
            {formatNumber(data.dayRange.low)} -{" "}
            {formatNumber(data.dayRange.high)}
          </div>
        </div>

        <div className="border hover:border-indigo-950 p-4 rounded">
          <div className="text-sm text-gray-600 mb-1">52 Week Range</div>
          <div className="text-lg font-semibold">
            {formatNumber(data.week52Range.low)} -{" "}
            {formatNumber(data.week52Range.high)}
          </div>
        </div>

        <div className="border hover:border-indigo-950 p-4 rounded">
          <div className="text-sm text-gray-600 mb-1">Volume</div>
          <div className="text-lg font-semibold">
            {formatLargeNumber(data.volume)}
          </div>
        </div>

        <div className="border hover:border-indigo-950 p-4 rounded">
          <div className="text-sm text-gray-600 mb-1">Avg. Volume</div>
          <div className="text-lg font-semibold">
            {formatLargeNumber(data.avgVolume)}
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.marketCap && (
          <div className="border hover:border-indigo-950 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">
              Market Cap (intraday)
            </div>
            <div className="text-lg font-semibold">
              {formatLargeNumber(data.marketCap)}
            </div>
          </div>
        )}

        {data.beta !== undefined && (
          <div className="border hover:border-indigo-950 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">Beta (5Y Monthly)</div>
            <div className="text-lg font-semibold">
              {formatNumber(data.beta)}
            </div>
          </div>
        )}

        {data.peRatio !== undefined && (
          <div className="border hover:border-indigo-950 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">PE Ratio (TTM)</div>
            <div className="text-lg font-semibold">
              {formatNumber(data.peRatio)}
            </div>
          </div>
        )}

        {data.eps !== undefined && (
          <div className="border hover:border-indigo-950 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">EPS (TTM)</div>
            <div className="text-lg font-semibold">
              {formatNumber(data.eps)}
            </div>
          </div>
        )}

        {data.earningsDate && (
          <div className="border hover:border-indigo-950 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">Earnings Date</div>
            <div className="text-lg font-semibold">
              {formatDate(data.earningsDate)}
            </div>
          </div>
        )}

        {(data.forwardDividend !== undefined ||
          data.forwardDividendYield !== undefined) && (
          <div className="border hover:border-indigo-950 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">
              Forward Dividend & Yield
            </div>
            <div className="text-lg font-semibold">
              {data.forwardDividend !== undefined
                ? formatNumber(data.forwardDividend)
                : "N/A"}
              {data.forwardDividendYield !== undefined && (
                <span className="text-sm">
                  {" "}
                  ({formatNumber(data.forwardDividendYield)}%)
                </span>
              )}
            </div>
          </div>
        )}

        {data.exDividendDate && (
          <div className="border hover:border-indigo-950 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">Ex-Dividend Date</div>
            <div className="text-lg font-semibold">
              {formatDate(data.exDividendDate)}
            </div>
          </div>
        )}

        {data.targetEstimate !== undefined && (
          <div className="border hover:border-indigo-950 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">1y Target Est</div>
            <div className="text-lg font-semibold">
              {formatNumber(data.targetEstimate)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
