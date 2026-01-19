import { ComprehensiveData } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

interface StockListProps {
  data: ComprehensiveData;
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

  const gridStyle = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";
  const textStyle = "text-sm text-muted-foreground mb-1";
  const statStyle = "text-lg font-semibold";

  return (
    <div className="comprehensive-stock-data space-y-2">
      {/* Price Section */}
      <Card>
        <CardHeader>
          <CardTitle>Price Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={gridStyle}>
            <div className="space-y-1">
              <div className={textStyle}>Previous Close</div>
              <div className={statStyle}>${formatNumber(data.previousClose)}</div>
            </div>

            <div className="space-y-1">
              <div className={textStyle}>Open</div>
              <div className={statStyle}>${formatNumber(data.open)}</div>
            </div>

            {data.bid && (
              <div className="space-y-1">
                <div className={textStyle}>Bid</div>
                <div className={statStyle}>
                  ${formatNumber(data.bid)}
                  {data.bidSize && (
                    <span className="text-sm text-muted-foreground"> x {data.bidSize}</span>
                  )}
                </div>
              </div>
            )}

            {data.ask && (
              <div className="space-y-1">
                <div className={textStyle}>Ask</div>
                <div className={statStyle}>
                  ${formatNumber(data.ask)}
                  {data.askSize && (
                    <span className="text-sm text-muted-foreground"> x {data.askSize}</span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className={textStyle}>Day&apos;s Range</div>
              <div className={statStyle}>
                ${formatNumber(data.dayRange.low)} - ${formatNumber(data.dayRange.high)}
              </div>
            </div>

            <div className="space-y-1">
              <div className={textStyle}>52 Week Range</div>
              <div className={statStyle}>
                ${formatNumber(data.week52Range.low)} - ${formatNumber(data.week52Range.high)}
              </div>
            </div>

            <div className="space-y-1">
              <div className={textStyle}>Volume</div>
              <div className={statStyle}>{formatLargeNumber(data.volume)}</div>
            </div>

            <div className="space-y-1">
              <div className={textStyle}>Avg. Volume</div>
              <div className={statStyle}>{formatLargeNumber(data.avgVolume)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Section */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={gridStyle}>
            {data.marketCap && (
              <div className="space-y-1">
                <div className={textStyle}>Market Cap (intraday)</div>
                <div className={statStyle}>{formatLargeNumber(data.marketCap)}</div>
              </div>
            )}

            {data.beta !== undefined && (
              <div className="space-y-1">
                <div className={textStyle}>Beta (5Y Monthly)</div>
                <div className={statStyle}>{formatNumber(data.beta)}</div>
              </div>
            )}

            {data.peRatio !== undefined && (
              <div className="space-y-1">
                <div className={textStyle}>PE Ratio (TTM)</div>
                <div className={statStyle}>{formatNumber(data.peRatio)}</div>
              </div>
            )}

            {data.eps !== undefined && (
              <div className="space-y-1">
                <div className={textStyle}>EPS (TTM)</div>
                <div className={statStyle}>${formatNumber(data.eps)}</div>
              </div>
            )}

            {data.earningsDate && (
              <div className="space-y-1">
                <div className={textStyle}>Earnings Date</div>
                <div className={statStyle}>{formatDate(data.earningsDate)}</div>
              </div>
            )}

            {(data.forwardDividend !== undefined ||
              data.forwardDividendYield !== undefined) && (
                <div className="space-y-1">
                  <div className={textStyle}>Forward Dividend & Yield</div>
                  <div className={statStyle}>
                    {data.forwardDividend !== undefined
                      ? `$${formatNumber(data.forwardDividend)}`
                      : "N/A"}
                    {data.forwardDividendYield !== undefined && (
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        ({formatNumber(data.forwardDividendYield)}%)
                      </span>
                    )}
                  </div>
                </div>
              )}

            {data.exDividendDate && (
              <div className="space-y-1">
                <div className={textStyle}>Ex-Dividend Date</div>
                <div className={statStyle}>{formatDate(data.exDividendDate)}</div>
              </div>
            )}

            {data.targetEstimate !== undefined && (
              <div className="space-y-1">
                <div className={textStyle}>1y Target Est</div>
                <div className={statStyle}>${formatNumber(data.targetEstimate)}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
