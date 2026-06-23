import { LegalSidebar } from '@/components/legal/legal-sidebar';

export default function LegalLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 md:py-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <LegalSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
