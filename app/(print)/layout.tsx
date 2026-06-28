export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ticket-page text-white antialiased">{children}</div>
  );
}
