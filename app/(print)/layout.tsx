export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c1017] text-white antialiased">{children}</div>
  );
}
