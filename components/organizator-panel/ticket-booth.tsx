'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Inbox, Loader2, Send, Ticket } from 'lucide-react';
import { QrScanner } from '@/components/tickets/qr-scanner';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { InvitationsPanel } from '@/components/organizator-panel/invitations-panel';

type BoothTab = 'sales' | 'invitation' | 'pending';

type OrganizerEvent = {
  id: string;
  title: string;
  startDate: string;
  status: string;
};

type PendingOrder = {
  id: string;
  total: number;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
};

const tabs: Array<{
  id: BoothTab;
  label: string;
  description: string;
  icon: typeof Ticket;
}> = [
  {
    id: 'sales',
    label: 'Bilet Satışı',
    description: 'QR ile giriş kontrolü',
    icon: Ticket
  },
  {
    id: 'invitation',
    label: 'Davetiye',
    description: 'QR kodlu davetiye gönder',
    icon: Send
  },
  {
    id: 'pending',
    label: 'Ödeme Bekleyen',
    description: 'Tamamlanmamış siparişler',
    icon: Inbox
  }
];

export function TicketBoothPanel() {
  const [activeTab, setActiveTab] = useState<BoothTab>('invitation');
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [eventId, setEventId] = useState('');
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === eventId),
    [events, eventId]
  );

  const loadEvents = useCallback(async () => {
    const res = await fetch('/api/organizer/events', { credentials: 'include' });
    if (!res.ok) throw new Error('Etkinlikler yüklenemedi');
    const data = (await res.json()) as { events: OrganizerEvent[] };
    const published = data.events.filter((e) => e.status === 'published');
    setEvents(published);
    if (!eventId && published[0]) setEventId(published[0].id);
  }, [eventId]);

  const loadPendingOrders = useCallback(async (id: string) => {
    if (!id) return;
    const res = await fetch(`/api/organizer/booth?eventId=${id}`, {
      credentials: 'include'
    });
    if (res.ok) {
      const booth = (await res.json()) as { pendingOrders: PendingOrder[] };
      setPendingOrders(booth.pendingOrders);
    }
  }, []);

  useEffect(() => {
    void loadEvents()
      .catch(() => setError('Etkinlikler yüklenemedi'))
      .finally(() => setLoading(false));
  }, [loadEvents]);

  useEffect(() => {
    if (!eventId) return;
    void loadPendingOrders(eventId).catch(() => setError('Gişe verileri yüklenemedi'));
  }, [eventId, loadPendingOrders]);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bilet Gişesi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tüm etkinliklerinize davetiye üretip QR kodlu bilet gönderimi yapabilirsiniz.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-col items-center rounded-xl border bg-card p-6 text-center transition-all',
                active
                  ? 'border-primary shadow-sm ring-1 ring-primary/30'
                  : 'border-border hover:border-border'
              )}
            >
              <Icon
                className={cn(
                  'mb-3 size-10',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span className="font-semibold text-foreground">{tab.label}</span>
              <span className="mt-1 text-xs text-muted-foreground">{tab.description}</span>
            </button>
          );
        })}
      </div>

      {activeTab !== 'invitation' && (
        <div className="rounded-xl border border-border bg-card p-4 md:p-6">
          <Label htmlFor="event-select" className="text-foreground">
            Etkinlik Adı
          </Label>
          <select
            id="event-select"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="mt-2 flex h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground"
          >
            {events.length === 0 ? (
              <option value="">Yayında etkinlik yok</option>
            ) : (
              events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))
            )}
          </select>
          {selectedEvent && (
            <p className="mt-2 text-xs text-muted-foreground">
              {new Date(selectedEvent.startDate).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {activeTab === 'invitation' && <InvitationsPanel initialEventId={eventId || undefined} />}

      {activeTab === 'sales' && (
        <div className="rounded-xl border border-border bg-card p-5 md:p-6">
          <h2 className="text-lg font-semibold text-foreground">Giriş Kontrolü</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Misafirlerin QR kodunu tarayarak etkinliğe giriş onaylayın.
          </p>
          <div className="mt-6">
            <QrScanner />
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="rounded-xl border border-border bg-card p-5 md:p-6">
          <h2 className="text-lg font-semibold text-foreground">Ödeme Bekleyen Siparişler</h2>
          {pendingOrders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Bu etkinlik için bekleyen ödeme yok.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pendingOrders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-lg border border-border px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{order.buyerName}</p>
                      <p className="text-xs text-muted-foreground">{order.buyerEmail}</p>
                    </div>
                    <p className="font-semibold text-primary">
                      {order.total.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {order.items
                      .map((item) => `${item.quantity}x ${item.name}`)
                      .join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
