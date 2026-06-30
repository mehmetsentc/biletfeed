'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QrScanner = dynamic(
  () =>
    import('@/components/tickets/qr-scanner').then((m) => m.QrScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-white/70">
        Tarayıcı yükleniyor…
      </div>
    ),
  }
);

export function TicketEntryScanner() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a0a0a] text-white">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-white hover:bg-white/10 hover:text-white"
          asChild
        >
          <Link href="/organizator-panel/baslangic" aria-label="Panele dön">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ScanLine className="size-5 shrink-0 text-primary" strokeWidth={2} />
            <h1 className="truncate text-lg font-semibold">Bilet Tara</h1>
          </div>
          <p className="truncate text-xs text-white/55">
            Girişte QR okutun — geçerli bilet otomatik kaydedilir
          </p>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <QrScanner variant="entry" autoStart />
      </main>
    </div>
  );
}
