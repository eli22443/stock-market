export default function WorldIndicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="world-indices-layout px-6">
      <h1 className="mb-6 font-bold text-2xl">World Indices</h1>
      {children}
    </div>
  );
}
