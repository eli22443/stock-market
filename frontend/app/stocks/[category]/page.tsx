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
import { stockCategorized, stocksMetrics } from "@/app/api/stocks/route";

const validCategories = ["most-active", "trending", "gainers", "losers"];

export default async function StocksCategory({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  /**
   * Show tables of all stocks based on category
   */

  const { category } = await params;

  // Validate category exists
  if (!validCategories.includes(category)) {
    notFound();
  }

  const response = await fetch(
    `${process.env.NEXT_URL}/api/stocks?category=${category}`
  );

  const data: stockCategorized = await response.json();

  console.log(data.stocks);

  const invoices = [
    {
      invoice: "INV001",
      paymentStatus: "Paid",
      totalAmount: "$250.00",
      paymentMethod: "Credit Card",
    },
    {
      invoice: "INV002",
      paymentStatus: "Pending",
      totalAmount: "$150.00",
      paymentMethod: "PayPal",
    },
  ];
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
