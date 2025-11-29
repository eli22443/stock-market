import Link from "next/link";
import type { StockRecord } from "../services/api";

export default function StockCard({ stock }: { stock: StockRecord }) {
  return (
    <div className="w-70 h-72 rounded-2xl border-2 border-blue-800 px-4 py-4">
      <div className="stock-info">
        <h1 className="text-2xl font-bold font-mono mb-2">{stock.symbol}</h1>
        <p>
          Current Price: <strong>${stock.data.c}</strong>
        </p>
        <p>
          High Price of the day: <strong>${stock.data.h}</strong>
        </p>
        <p>
          Low Price of the day: <strong>${stock.data.l}</strong>
        </p>
        <p>
          Open Price of the day: <strong>${stock.data.o}</strong>
        </p>
        <p>
          Previous Close Price: <strong>${stock.data.pc}</strong>
        </p>
      </div>
      <div className="stock-graph py-4">
        <img src={"link"}></img>
      </div>
      <div className="stock-overlay">
        <Link
          href={`/quote/${stock.symbol}`}
          className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
        >
          $$$
        </Link>
      </div>
    </div>
  );
}
