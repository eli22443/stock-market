import StocksMenu from "@/components/StocksMenu";

export default function StocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="stocks-layout space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Stocks</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Explore market trends, top gainers, losers, and more
        </p>
      </div>
      <StocksMenu />
      {children}
    </div>
  );
}
