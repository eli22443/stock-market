export default function QuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // add navbar
    <div>
      <h1 className="my-4">Quote Layout</h1>
      {children}
    </div>
  );
}
