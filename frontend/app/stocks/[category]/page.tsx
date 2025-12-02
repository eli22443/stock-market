import { notFound } from "next/navigation";
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
import { stockCategorized } from "@/app/api/stocks/route";

const validCategories = ["most-active", "trending", "gainers", "losers"];

export default async function StocksCategory({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!validCategories.includes(category)) {
    notFound();
  }

  const apiUrl = process.env.NEXT_URL
    ? `${process.env.NEXT_URL}/api/stocks?category=${category}`
    : `http://localhost:3000/api/stocks?category=${category}`;

  /**show logs on console (browser) */
  // console.log("Fetching from API:", apiUrl);
  const response = await fetch(apiUrl);
  // console.log("API response status:", response.status);

  const data: stockCategorized = await response.json();

  return (
    <div className=" border flex justify-center">
      <div className="w-200">
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
                <TableCell>{stock.symbol}</TableCell>
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
