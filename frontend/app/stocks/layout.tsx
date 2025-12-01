import StocksMenu from "@/components/StocksMenu";
import { Input } from "@/components/ui/input";
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

export default function StocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // add navbar
    <div>
      <h1 className="mb-6 font-bold text-2xl">Stocks</h1>
      <StocksMenu />
      <Input className="w-20" type="text" />
      <Table className="" />
      {children}
    </div>
  );
}
