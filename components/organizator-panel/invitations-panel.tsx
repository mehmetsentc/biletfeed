'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Download,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  QrCode,
  Send
} from 'lucide-react';
import { TicketQR } from '@/components/tickets/ticket-qr';
import { BulkInvitationsPanel } from '@/components/organizator-panel/bulk-invitations-panel';
import { MAX_DIRECT_INVITATION_PDFS } from '@/lib/config/invitations';
import type { InvitationRow } from '@/lib/services/event-invitations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

export type { InvitationRow };

export function InvitationsPanel({
  initialEventId
}: {
  initialEventId?: string;
}) {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [eventId, setEventId] = useState(initialEventId ?? '');
  const [ticketTypes, setTicketTypes] = useState<TicketTypeOption[]>([]);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<InvitationRow | null>(null);
  const [copied, setCopied] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [ticketTypeId, setTicketTypeId] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

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
    if (initialEventId && published.some((e) => e.id === initialEventId)) {
      setEventId(initialEventId);
    } else if (!eventId && published[0]) {
      setEventId(published[0].id);
    }
  }, [eventId, initialEventId]);

  const loadEventData = useCallback(async (id: string) => {
    if (!id) return;
    const [boothRes, inviteRes] = await Promise.all([
      fetch(`/api/organizer/booth?eventId=${id}`, { credentials: 'include' }),
      fetch(`/api/organizer/invitations?eventId=${id}`, { credentials: 'include' })
    ]);

    if (boothRes.ok) {
      const booth = (await boothRes.json()) as { ticketTypes: TicketTypeOption[] };
      setTicketTypes(booth.ticketTypes);
      setTicketTypeId((prev) => prev || booth.ticketTypes[0]?.id || '');
    }

    if (inviteRes.ok) {
      const inviteData = (await inviteRes.json()) as { invitations: InvitationRow[] };
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
    void loadEventData(eventId).catch(() => setError('Davetiye verileri yüklenemedi'));
  }, [eventId, loadEventData]);

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
        credentials: 'include',
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
        invitation?: InvitationRow;
      };
      if (!res.ok) throw new Error(data.error || 'Davetiye gönderilemedi');

      const invitation = data.invitation!;
      const hadEmail = Boolean(guestEmail.trim());
      setLastInvite(invitation);
      setInvitations((prev) => [invitation, ...prev]);
      setSuccess(
        hadEmail
          ? `${invitation.guestName} için davetiye oluşturuldu, PDF e-posta ile gönderildi.`
          : `${invitation.guestName} için PDF davetiye oluşturuldu.`
      );
      downloadPdf(invitation);
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

  function shareWhatsApp(invite: InvitationRow) {
    const text = encodeURIComponent(
      `Merhaba ${invite.guestName}, etkinlik davetiyeniz hazır: ${invite.inviteUrl}`
    );
    const phone = invite.guestPhone?.replace(/\D/g, '');
    const url = phone
      ? `https://wa.me/${phone.startsWith('90') ? phone : `90${phone.replace(/^0/, '')}`}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function downloadPdf(invite: InvitationRow) {
    window.open(invite.pdfUrl, '_blank', 'noopener,noreferrer');
  }

  async function sharePdfsDirect(invites: InvitationRow[]) {
    if (invites.length > MAX_DIRECT_INVITATION_PDFS) {
      setError(
        `Doğrudan paylaşımda en fazla ${MAX_DIRECT_INVITATION_PDFS} PDF gönderilebilir. ZIP indirmeyi kullanın.`
      );
      return;
    }
    if (!navigator.share) {
      setError('Tarayıcınız dosya paylaşımını desteklemiyor. PDF indir butonunu kullanın.');
      return;
    }
    try {
      const files: File[] = [];
      for (const invite of invites) {
        const res = await fetch(invite.pdfUrl, { credentials: 'include' });
        if (!res.ok) continue;
        const blob = await res.blob();
        files.push(new File([blob], `${invite.ticketCode}.pdf`, { type: 'application/pdf' }));
      }
      if (files.length === 0) throw new Error('PDF alınamadı');
      await navigator.share({
        title: 'Davetiyeler',
        text: 'Etkinlik davetiyeleriniz',
        files
      });
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    }
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
      <div className="rounded-xl border border-border bg-card p-4 md:p-6">
        <Label htmlFor="event-select" className="text-foreground">
          Etkinlik
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
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="flex gap-2 rounded-lg border border-border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
            mode === 'single' ? 'bg-card shadow-sm' : 'text-muted-foreground'
          }`}
        >
          Tekli Gönderim
        </button>
        <button
          type="button"
          onClick={() => setMode('bulk')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
            mode === 'bulk' ? 'bg-card shadow-sm' : 'text-muted-foreground'
          }`}
        >
          Toplu Gönderim
        </button>
      </div>

      {mode === 'bulk' ? (
        <BulkInvitationsPanel
          eventId={eventId}
          ticketTypeId={ticketTypeId}
          disabled={!eventId || !ticketTypeId}
          onCreated={(rows) => setInvitations((prev) => [...rows, ...prev])}
        />
      ) : (
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSendInvitation}
          className="rounded-xl border border-border bg-card p-5 md:p-6"
        >
          <div className="flex items-center gap-2">
            <Send className="size-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Yeni Davetiye</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Misafir adına QR kodlu PDF davetiye oluşturulur. E-posta ile PDF ekli gönderilir.
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
                {ticketTypes.length === 0 ? (
                  <option value="">Bilet türü yok</option>
                ) : (
                  ticketTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.sold}/{type.capacity})
                    </option>
                  ))
                )}
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
              <p className="mt-1 text-xs text-muted-foreground">
                E-posta girilirse davetiye otomatik gönderilir.
              </p>
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
                Davetiye Oluştur ve Gönder
              </>
            )}
          </Button>
        </form>

        <div className="space-y-4">
          {lastInvite && (
            <div className="rounded-xl border border-primary/40 bg-accent p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground">Son Davetiye</h3>
                <Badge variant="secondary">QR Hazır</Badge>
              </div>
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
                  onClick={() => downloadPdf(lastInvite)}
                >
                  <FileText className="mr-1.5 size-4" />
                  PDF İndir
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyInviteLink(lastInvite.inviteUrl)}
                >
                >
                  <Copy className="mr-1.5 size-4" />
                  {copied ? 'Kopyalandı' : 'Linki Kopyala'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void sharePdfsDirect([lastInvite])}
                >
                  <Download className="mr-1.5 size-4" />
                  PDF Paylaş
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
              <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto">
                {invitations.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-foreground">
                          {invite.guestName}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            'shrink-0 text-[10px]',
                            invite.status === 'viewed' && 'border-emerald-500/50 text-emerald-700'
                          )}
                        >
                          {invite.status === 'viewed' ? 'Görüldü' : 'Gönderildi'}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {invite.ticketTypeName} · {invite.ticketCode}
                      </p>
                      {invite.guestEmail && (
                        <p className="truncate text-xs text-muted-foreground">
                          {invite.guestEmail}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadPdf(invite)}
                      title="PDF indir"
                    >
                      <FileText className="size-4" />
                    </Button>
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
    </div>
  );
}
