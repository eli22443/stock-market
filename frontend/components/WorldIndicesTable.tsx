/**
 * Table showing data of different world indices.
 * Use inside /world-indices page.
 */
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type IndexData = {
  symbol: string;
  name: string;
  data: {
    c: number; // current price
    d: number; // change
    dp: number; // percent change
    h: number; // high
    l: number; // low
    o: number; // open
    pc: number; // previous close
    t: number; // time
  };
  changePercent: number;
  priceRange: number;
  priceChange: number;
  // Additional comprehensive data fields
  volume?: number;
  avgVolume?: number;
  marketCap?: number;
  peRatio?: number;
  week52ChangePercent?: number;
};

type WorldIndicesData = {
  indices: IndexData[];
  count: number;
};

export default function WorldIndicesTable({
  data,
}: {
  data: WorldIndicesData;
}) {
  // Helper function to format large numbers (volume, market cap)
  const formatLargeNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(0);
  };

  return (
    <div className="border border-indigo-950 w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Index</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>Change %</TableHead>
            <TableHead>Volume</TableHead>
            <TableHead>Avg Vol</TableHead>
            <TableHead>52W Change %</TableHead>
            <TableHead>Low</TableHead>
            <TableHead>High</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.indices.map((index, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <Link
                  href={`/quote/${index.symbol}`}
                  className="nav-link px-2 text-indigo-500 font-bold"
                >
                  {index.symbol}
                </Link>
              </TableCell>
              <TableCell>{index.name}</TableCell>
              <TableCell>{index.data.c.toFixed(2)}</TableCell>
              <TableCell
                className={
                  index.priceChange >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {index.priceChange >= 0 ? "+" : ""}
                {index.priceChange.toFixed(2)}
              </TableCell>
              <TableCell
                className={
                  index.changePercent >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {index.changePercent >= 0 ? "+" : ""}
                {index.changePercent.toFixed(2)}%
              </TableCell>
              <TableCell>{formatLargeNumber(index.volume)}</TableCell>
              <TableCell>{formatLargeNumber(index.avgVolume)}</TableCell>
              <TableCell
                className={
                  index.week52ChangePercent !== undefined &&
                  index.week52ChangePercent >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {index.week52ChangePercent !== undefined
                  ? `${
                      index.week52ChangePercent >= 0 ? "+" : ""
                    }${index.week52ChangePercent.toFixed(2)}%`
                  : "N/A"}
              </TableCell>
              <TableCell>{index.data.l.toFixed(2)}</TableCell>
              <TableCell>{index.data.h.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
