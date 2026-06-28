'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  QrCode,
  Star,
  Ticket
} from 'lucide-react';
import { QrScanner } from '@/components/tickets/qr-scanner';
import { TicketQR } from '@/components/tickets/ticket-qr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type BoothTab = 'sales' | 'invitation' | 'pending';

type OrganizerEvent = {
  id: string;
  title: string;
  startDate: string;
  status: string;
};

type TicketTypeOption = {
  id: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
};

type Invitation = {
  id: string;
  guestName: string;
  guestEmail: string | null;
  inviteUrl: string;
  qrData: string;
  ticketCode: string;
  ticketTypeName: string;
  createdAt: string;
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
    icon: Star
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
  const [ticketTypes, setTicketTypes] = useState<TicketTypeOption[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [ticketTypeId, setTicketTypeId] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === eventId),
    [events, eventId]
  );

  const loadEvents = useCallback(async () => {
    const res = await fetch('/api/organizer/events', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('Etkinlikler yüklenemedi');
    const data = (await res.json()) as { events: OrganizerEvent[] };
    const published = data.events.filter((e) => e.status === 'published');
    setEvents(published);
    if (!eventId && published[0]) setEventId(published[0].id);
  }, [eventId]);

  const loadBoothData = useCallback(async (id: string) => {
    if (!id) return;
    const [boothRes, inviteRes] = await Promise.all([
      fetch(`/api/organizer/booth?eventId=${id}`, { credentials: 'same-origin' }),
      fetch(`/api/organizer/invitations?eventId=${id}`, {
        credentials: 'same-origin'
      })
    ]);

    if (boothRes.ok) {
      const booth = (await boothRes.json()) as {
        ticketTypes: TicketTypeOption[];
        pendingOrders: PendingOrder[];
      };
      setTicketTypes(booth.ticketTypes);
      setPendingOrders(booth.pendingOrders);
      setTicketTypeId(booth.ticketTypes[0]?.id || '');
    }

    if (inviteRes.ok) {
      const inviteData = (await inviteRes.json()) as { invitations: Invitation[] };
      setInvitations(inviteData.invitations);
    }
  }, []);

  useEffect(() => {
    void loadEvents()
      .catch(() => setError('Etkinlikler yüklenemedi'))
      .finally(() => setLoading(false));
  }, [loadEvents]);

  useEffect(() => {
    if (!eventId) return;
    void loadBoothData(eventId).catch(() => setError('Gişe verileri yüklenemedi'));
  }, [eventId, loadBoothData]);

  async function handleSendInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId || !ticketTypeId) return;

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/organizer/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          eventId,
          ticketTypeId,
          guestName,
          guestEmail: guestEmail || undefined,
          guestPhone: guestPhone || undefined,
          personalMessage: personalMessage || undefined
        })
      });

      const data = (await res.json()) as {
        error?: string;
        invitation?: Invitation;
      };
      if (!res.ok) throw new Error(data.error || 'Davetiye gönderilemedi');

      const invitation = data.invitation!;
      setLastInvite(invitation);
      setInvitations((prev) => [invitation, ...prev]);
      setSuccess(`${invitation.guestName} için QR kodlu davetiye oluşturuldu.`);
      setGuestName('');
      setGuestEmail('');
      setGuestPhone('');
      setPersonalMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Davetiye gönderilemedi');
    } finally {
      setSending(false);
    }
  }

  function copyInviteLink(url: string) {
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp(invite: Invitation) {
    const text = encodeURIComponent(
      `Merhaba ${invite.guestName}, etkinlik davetiyeniz hazır: ${invite.inviteUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

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

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {activeTab === 'invitation' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleSendInvitation}
            className="rounded-xl border border-border bg-card p-5 md:p-6"
          >
            <h2 className="text-lg font-semibold text-foreground">Davetiye Gönder</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Misafir adına QR kodlu ücretsiz bilet oluşturulur.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <Label htmlFor="ticket-type">Bilet Türü</Label>
                <select
                  id="ticket-type"
                  value={ticketTypeId}
                  onChange={(e) => setTicketTypeId(e.target.value)}
                  className="mt-1.5 flex h-10 w-full rounded-md border border-border px-3 text-sm"
                  required
                >
                  {ticketTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.sold}/{type.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="guest-name">Misafir Adı</Label>
                <Input
                  id="guest-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Ad Soyad"
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="guest-email">E-posta (isteğe bağlı)</Label>
                <Input
                  id="guest-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="misafir@email.com"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="guest-phone">Telefon (isteğe bağlı)</Label>
                <Input
                  id="guest-phone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="05xx xxx xx xx"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="message">Kişisel Mesaj</Label>
                <textarea
                  id="message"
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder="Davetiyenize kısa bir not ekleyin..."
                  className="mt-1.5 min-h-[90px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-6 w-full"
              disabled={sending || !eventId || ticketTypes.length === 0}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 size-4" />
                  QR Kodlu Davetiye Oluştur
                </>
              )}
            </Button>
          </form>

          <div className="space-y-4">
            {lastInvite && (
              <div className="rounded-xl border border-primary/40 bg-accent p-5">
                <h3 className="font-semibold text-foreground">Son Davetiye</h3>
                <p className="mt-1 text-sm text-muted-foreground">{lastInvite.guestName}</p>
                <div className="mt-4 flex justify-center rounded-lg bg-card p-4">
                  <TicketQR data={lastInvite.qrData} size={160} />
                </div>
                <p className="mt-3 text-center font-mono text-sm text-foreground">
                  {lastInvite.ticketCode}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyInviteLink(lastInvite.inviteUrl)}
                  >
                    <Copy className="mr-1.5 size-4" />
                    {copied ? 'Kopyalandı' : 'Linki Kopyala'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => shareWhatsApp(lastInvite)}
                  >
                    <MessageCircle className="mr-1.5 size-4" />
                    WhatsApp
                  </Button>
                  {lastInvite.guestEmail && (
                    <Button type="button" variant="outline" size="sm" asChild>
                      <a
                        href={`mailto:${lastInvite.guestEmail}?subject=Etkinlik Davetiyeniz&body=${encodeURIComponent(`Davetiye linkiniz: ${lastInvite.inviteUrl}`)}`}
                      >
                        <Mail className="mr-1.5 size-4" />
                        E-posta
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">
                Gönderilen Davetiyeler ({invitations.length})
              </h3>
              {invitations.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Henüz davetiye gönderilmedi.
                </p>
              ) : (
                <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto">
                  {invitations.map((invite) => (
                    <li
                      key={invite.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {invite.guestName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {invite.ticketTypeName} · {invite.ticketCode}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyInviteLink(invite.inviteUrl)}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

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
