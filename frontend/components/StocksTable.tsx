/**
 * Table showing data of different stocks.
 * Use inside /stocks/[category] page.
 */
import { StockCategorized } from "@/types";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StocksTable({ data }: { data: StockCategorized }) {
  // Helper function to format large numbers (volume, market cap)
  const formatLargeNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(0);
  };

  // Helper function to format numbers with commas
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className="border border-indigo-950 w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stock</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>Change %</TableHead>
            <TableHead>Volume</TableHead>
            <TableHead>Avg Vol</TableHead>
            <TableHead>Market Cap</TableHead>
            <TableHead>P/E Ratio</TableHead>
            <TableHead>52W Change %</TableHead>
            <TableHead>Low</TableHead>
            <TableHead>High</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.stocks.map((stock, index) => (
            <TableRow key={index}>
              <TableCell>
                <Link
                  href={`/quote/${stock.symbol.toUpperCase()}`}
                  className="nav-link px-2 text-indigo-500 font-bold"
                >
                  {stock.symbol}
                </Link>
              </TableCell>
              <TableCell>{stock.name || stock.symbol}</TableCell>
              <TableCell>{stock.data.c.toFixed(2)}</TableCell>
              <TableCell
                className={
                  stock.priceChange >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {stock.priceChange >= 0 ? "+" : ""}
                {stock.priceChange.toFixed(2)}
              </TableCell>
              <TableCell
                className={
                  stock.changePercent >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {stock.changePercent >= 0 ? "+" : ""}
                {stock.changePercent.toFixed(2)}%
              </TableCell>
              <TableCell>{formatLargeNumber(stock.volume)}</TableCell>
              <TableCell>{formatLargeNumber(stock.avgVolume)}</TableCell>
              <TableCell>{formatLargeNumber(stock.marketCap)}</TableCell>
              <TableCell>
                {stock.peRatio !== undefined ? stock.peRatio.toFixed(2) : "N/A"}
              </TableCell>
              <TableCell
                className={
                  stock.week52ChangePercent !== undefined &&
                  stock.week52ChangePercent >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {stock.week52ChangePercent !== undefined
                  ? `${
                      stock.week52ChangePercent >= 0 ? "+" : ""
                    }${stock.week52ChangePercent.toFixed(2)}%`
                  : "N/A"}
              </TableCell>
              <TableCell>{stock.data.l.toFixed(2)}</TableCell>
              <TableCell>{stock.data.h.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
