'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { ArrowLeft, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getOrCreateScannerId } from '@/lib/tickets/offline-scan-queue';

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

class ScannerErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error('QR scanner render error', error, info);
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-6 text-center text-sm text-red-200">
          <p className="font-semibold">Tarayıcı açılamadı</p>
          <p className="mt-2 opacity-90">
            Sayfayı yenileyin veya manuel bilet kodu girin. Kamera için Safari/Chrome
            kullanın.
          </p>
          <Button
            type="button"
            className="mt-4 bg-white text-black hover:bg-white/90"
            onClick={() => this.setState({ failed: false })}
          >
            Tekrar dene
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

type OrganizerEvent = {
  id: string;
  title: string;
  startDate: string;
  status: string;
};

export function TicketEntryScanner() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [eventId, setEventId] = useState<string>('all');
  const [scannerId, setScannerId] = useState<string | undefined>();
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    setScannerId(getOrCreateScannerId());
    const timer = window.setTimeout(() => setCameraReady(true), 150);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    void fetch('/api/organizer/events', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { events?: OrganizerEvent[] }) => {
        const list = (data.events ?? []).filter((e) => e.status === 'published');
        setEvents(list);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a0a0a] text-white">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-white hover:bg-white/10 hover:text-white"
          asChild
        >
          <Link href="/baslangic" aria-label="Panele dön">
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

      {events.length > 0 && (
        <div className="border-b border-white/10 px-4 py-3">
          <label htmlFor="event-filter" className="mb-1.5 block text-xs text-white/50">
            Etkinlik filtresi
          </label>
          <select
            id="event-filter"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 text-sm text-white"
          >
            <option value="all">Tüm etkinlikler</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <main className="flex flex-1 flex-col px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <ScannerErrorBoundary>
          {scannerId ? (
            <QrScanner
              variant="entry"
              autoStart={cameraReady}
              eventId={eventId === 'all' ? undefined : eventId}
              scannerId={scannerId}
            />
          ) : (
            <div className="flex min-h-[50vh] items-center justify-center text-sm text-white/70">
              Tarayıcı hazırlanıyor…
            </div>
          )}
        </ScannerErrorBoundary>
      </main>
    </div>
  );
}
