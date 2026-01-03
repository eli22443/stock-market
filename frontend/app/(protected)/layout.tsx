export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="protected-layout">{children}</div>;
}

