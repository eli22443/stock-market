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
  return (
    <div className="border border-indigo-950 w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stock</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>Change %</TableHead>
            <TableHead>High</TableHead>
            <TableHead>Low</TableHead>
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
              <TableCell>{stock.data.h.toFixed(2)}</TableCell>
              <TableCell>{stock.data.l.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
