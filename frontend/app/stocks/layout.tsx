import StocksMenu from "@/components/StocksMenu";
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
      {children}
    </div>
  );
}
