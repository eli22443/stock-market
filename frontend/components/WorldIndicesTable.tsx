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
  console.log(data.indices);
  return (
    <div className="border border-indigo-950 w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Index</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>Change %</TableHead>
            <TableHead>High</TableHead>
            <TableHead>Low</TableHead>
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
              <TableCell>{index.data.h.toFixed(2)}</TableCell>
              <TableCell>{index.data.l.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
