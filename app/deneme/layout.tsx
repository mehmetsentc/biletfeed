import { notFound } from 'next/navigation';

/** İstek anında değerlendirilsin — build sırasında static notFound tetiklenmesin. */
export const dynamic = 'force-dynamic';

export default function DenemeLayout({ children }: { children: React.ReactNode }) {
  // Sadece Vercel production’da kapalı (local açık). Soft launch: ENABLE_HOT_TICKETS=1
  const isVercelProduction = process.env.VERCEL_ENV === 'production';
  const enabled = process.env.ENABLE_HOT_TICKETS === '1';
  if (isVercelProduction && !enabled) {
    notFound();
  }

  return (
    <div
      className="light fixed inset-0 z-[200] h-[100dvh] w-full overflow-hidden bg-[#f4f4f5] text-zinc-900 antialiased"
      style={{ colorScheme: 'light', backgroundColor: '#f4f4f5' }}
      data-theme="light"
    >
      {children}
    </div>
  );
}
