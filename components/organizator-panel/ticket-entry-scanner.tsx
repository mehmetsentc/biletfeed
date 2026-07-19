'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { ArrowLeft, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getOrCreateScannerId } from '@/lib/tickets/offline-scan-queue';
import { ScannerGateAccessPanel } from '@/components/organizator-panel/scanner-gate-access-panel';
import { isOnGirisHost, panelHref } from '@/lib/config/domain';

const QrScanner = dynamic(
  () => import('@/components/tickets/qr-scanner').then((m) => m.QrScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-white/70">
        Tarayıcı yükleniyor…
      </div>
    )
  }
);

type OrganizerEvent = {
  id: string;
  title: string;
  startDate: string;
  status: string;
};

export function TicketEntryScanner() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [eventId, setEventId] = useState<string>('all');
  const [gateLockedEventId, setGateLockedEventId] = useState<string | null>(null);
  const [gateLockedEventTitle, setGateLockedEventTitle] = useState<string | null>(null);
  const [scannerId, setScannerId] = useState<string | undefined>();
  const [cameraReady, setCameraReady] = useState(false);
  const [scannerAccount, setScannerAccount] = useState<{
    email: string;
    organizerName: string;
  } | null>(null);
  const [isGateTerminal, setIsGateTerminal] = useState(false);

  useEffect(() => {
    setScannerId(getOrCreateScannerId());
    setIsGateTerminal(
      isOnGirisHost(window.location.hostname) ||
        window.location.pathname.startsWith('/giris-terminal')
    );
    const timer = window.setTimeout(() => setCameraReady(true), 150);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    void fetch('/api/organizer/profile', { credentials: 'include' })
      .then((r) => r.json())
      .then(
        (data: {
          organizer?: { name: string };
          user?: { email: string };
          gateScope?: { eventId: string; eventTitle: string } | null;
        }) => {
        if (data.organizer?.name && data.user?.email) {
          setScannerAccount({
            email: data.user.email,
            organizerName: data.organizer.name
          });
        }
        if (data.gateScope?.eventId) {
          setGateLockedEventId(data.gateScope.eventId);
          setGateLockedEventTitle(data.gateScope.eventTitle ?? null);
          setEventId(data.gateScope.eventId);
        }
      })
      .catch(() => {});
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
        {!isGateTerminal && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href={panelHref('/baslangic')} aria-label="Panele dön">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ScanLine className="size-5 shrink-0 text-[var(--bf-accent-ink)]" strokeWidth={2} />
            <h1 className="truncate text-lg font-semibold">Bilet Tara</h1>
          </div>
          <p className="truncate text-xs text-white/55">
            Girişte QR okutun — geçerli bilet otomatik kaydedilir
          </p>
        </div>
      </header>

      {!isGateTerminal && (
        <ScannerGateAccessPanel
          events={events}
          selectedEventId={eventId}
          onEventChange={setEventId}
        />
      )}

      {scannerAccount && (
        <div className="border-b border-white/10 px-4 py-2 text-xs text-white/60">
          Giriş: <span className="text-white/90">{scannerAccount.email}</span>
          {' · '}
          Organizasyon:{' '}
          <span className="font-medium text-[var(--bf-accent-ink)]">{scannerAccount.organizerName}</span>
        </div>
      )}

      {events.length > 0 && (
        <div className="border-b border-white/10 px-4 py-3">
          <label htmlFor="event-filter" className="mb-1.5 block text-xs text-white/50">
            {gateLockedEventId ? 'Kapı kodu etkinliği' : 'Etkinlik filtresi'}
          </label>
          {gateLockedEventId ? (
            <p className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2.5 text-sm font-medium text-amber-100">
              {gateLockedEventTitle ??
                events.find((e) => e.id === gateLockedEventId)?.title ??
                'Tanımlı etkinlik'}
              <span className="mt-1 block text-xs font-normal text-amber-100/70">
                Bu oturum yalnızca bu etkinliğin biletlerini tarayabilir
              </span>
            </p>
          ) : (
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
          )}
        </div>
      )}

      <main className="flex flex-1 flex-col px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {scannerId ? (
          <QrScanner
            variant="entry"
            autoStart={cameraReady}
            eventId={
              gateLockedEventId ??
              (eventId === 'all' ? undefined : eventId)
            }
            scannerId={scannerId}
          />
        ) : (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-white/70">
            Tarayıcı hazırlanıyor…
          </div>
        )}
      </main>
    </div>
  );
}
