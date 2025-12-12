/**
 * Table showing data of different stocks.
 * Use inside /stocks/[category] page.
 */
import { StockCategorized } from "@/types";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StocksTable({ data }: { data: StockCategorized }) {
  return (
    <div className="flex justify-center">
      <div className="border border-indigo-950 w-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Change %</TableHead>
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
                <TableCell>{stock.data.c.toFixed(2)}</TableCell>
                <TableCell>{stock.priceChange.toFixed(2)}</TableCell>
                <TableCell>{stock.changePercent.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
