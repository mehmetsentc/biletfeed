'use client';

import { useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  Download,
  Loader2,
  Upload,
  Users
} from 'lucide-react';
import { MAX_DIRECT_INVITATION_PDFS, MAX_INVITATION_QUANTITY } from '@/lib/config/invitations';
import type { InvitationRow } from '@/lib/services/event-invitations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { invitationFetchErrorMessage } from '@/lib/organizator/invitation-fetch-error';

type TicketTypeOption = {
  id: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
};

type GuestDraft = {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
};

const MAX_BULK_QUANTITY = MAX_INVITATION_QUANTITY;

function expandRecipientGuests(input: {
  recipientName: string;
  quantity: number;
  guestEmail: string;
  guestPhone: string;
}): GuestDraft[] {
  const name = input.recipientName.trim();
  const qty = Math.min(MAX_BULK_QUANTITY, Math.max(1, input.quantity));

  return Array.from({ length: qty }, (_, index) => ({
    guestName: qty === 1 ? name : `${name} #${index + 1}`,
    guestEmail: input.guestEmail.trim(),
    guestPhone: input.guestPhone.trim()
  }));
}

function parseCsvGuests(text: string): GuestDraft[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      return {
        guestName: parts[0] ?? '',
        guestEmail: parts[1] ?? '',
        guestPhone: parts[2] ?? ''
      };
    })
    .filter((g) => g.guestName.length >= 2);
}

export function BulkInvitationsPanel({
  eventId,
  ticketTypes,
  ticketTypeId,
  onTicketTypeChange,
  disabled,
  onCreated
}: {
  eventId: string;
  ticketTypes: TicketTypeOption[];
  ticketTypeId: string;
  onTicketTypeChange: (id: string) => void;
  disabled?: boolean;
  onCreated: (rows: InvitationRow[]) => void;
}) {
  const [recipientName, setRecipientName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [sendEmails, setSendEmails] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<InvitationRow[]>([]);
  const [zipLoading, setZipLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [csvText, setCsvText] = useState('');

  const csvGuests = parseCsvGuests(csvText);
  const quantityGuests =
    recipientName.trim().length >= 2
      ? expandRecipientGuests({
          recipientName,
          quantity,
          guestEmail,
          guestPhone
        })
      : [];

  const guests = showAdvanced && csvGuests.length > 0 ? csvGuests : quantityGuests;
  const selectedType = ticketTypes.find((t) => t.id === ticketTypeId);
  const remainingCapacity = selectedType
    ? Math.max(0, selectedType.capacity - selectedType.sold)
    : 0;
  const overCapacity = guests.length > remainingCapacity && remainingCapacity > 0;

  async function handleBulkSend() {
    if (!eventId || !ticketTypeId || guests.length === 0) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/organizer/invitations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eventId,
          ticketTypeId,
          sendEmails,
          guests
        })
      });
      const data = (await res.json()) as {
        error?: string;
        created?: InvitationRow[];
        errors?: Array<{ guestName: string; error: string }>;
        emailStatus?: 'queued' | 'skipped';
        emailQueued?: number;
      };
      if (!res.ok) throw new Error(data.error || 'Toplu gönderim başarısız');

      const created = data.created ?? [];
      setLastCreated(created);
      onCreated(created);

      if (!showAdvanced) {
        setRecipientName('');
        setQuantity(1);
        setGuestEmail('');
        setGuestPhone('');
      } else {
        setCsvText('');
      }

      // Büyük ZIP'i otomatik indirme — 60 PDF üretim timeout'u Failed to fetch üretiyordu.
      // Küçük partilerde otomatik indir; büyüğünde kullanıcı "ZIP İndir" kullanır.
      if (created.length > 0 && created.length <= MAX_DIRECT_INVITATION_PDFS) {
        await downloadZipForIds(created.map((r) => r.id));
      }

      const emailQueued =
        data.emailStatus === 'queued' || (data.emailQueued ?? 0) > 0;

      if (created.length > 0 && sendEmails && emailQueued) {
        setSuccess(
          created.length > MAX_DIRECT_INVITATION_PDFS
            ? `${created.length} davetiye oluşturuldu. E-posta arka planda gönderiliyor. PDF ZIP için aşağıdaki indirme butonunu kullanın.`
            : `${created.length} davetiye oluşturuldu. E-posta arka planda gönderiliyor (${data.emailQueued ?? created.length} alıcı).`
        );
      } else if (created.length > 0) {
        setSuccess(
          created.length > MAX_DIRECT_INVITATION_PDFS
            ? `${created.length} davetiye oluşturuldu. PDF ZIP için aşağıdaki indirme butonunu kullanın.`
            : `${created.length} davetiye oluşturuldu.`
        );
      }

      if (data.errors?.length) {
        const capacityNote = data.errors.some((e) =>
          e.error.toLowerCase().includes('kontenjan')
        )
          ? ' (kontenjan doldu)'
          : '';
        setError(
          `${created.length} davetiye oluşturuldu, ${data.errors.length} hata${capacityNote}: ${data.errors
            .map((e) => e.guestName)
            .slice(0, 5)
            .join(', ')}${data.errors.length > 5 ? '…' : ''}`
        );
      }
    } catch (err) {
      setError(invitationFetchErrorMessage(err, 'Toplu gönderim başarısız'));
    } finally {
      setLoading(false);
    }
  }

  async function downloadZipForIds(ids: string[]) {
    if (ids.length === 0) return;
    setZipLoading(true);
    try {
      // Çok büyük ZIP isteklerini parçala — serverless timeout'unu önle
      const CHUNK = 25;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const chunk = ids.slice(i, i + CHUNK);
        const res = await fetch('/api/organizer/invitations/bulk/zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ invitationIds: chunk })
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || 'ZIP oluşturulamadı');
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          ids.length > CHUNK
            ? `BiletFeed-Davetiyeler-${Math.floor(i / CHUNK) + 1}.zip`
            : 'BiletFeed-Davetiyeler.zip';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError(invitationFetchErrorMessage(err, 'ZIP indirilemedi'));
    } finally {
      setZipLoading(false);
    }
  }

  async function downloadZip() {
    if (lastCreated.length === 0) return;
    await downloadZipForIds(lastCreated.map((r) => r.id));
  }

  const overDirectLimit = guests.length > MAX_DIRECT_INVITATION_PDFS;

  return (
    <div className="rounded-xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Users className="size-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Toplu Davetiye</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Bir firmaya veya kişiye tek seferde çok sayıda davetiye gönderin. Her bilet için
        ayrı QR kodlu PDF oluşturulur; aynı e-posta adresine tek mail ve ZIP eki gider,
        tarayıcıdan ZIP otomatik indirilir.
      </p>

      {overDirectLimit && (
        <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            {MAX_DIRECT_INVITATION_PDFS} adetten fazla davetiyede doğrudan PDF paylaşımı
            önerilmez. Sistem otomatik ZIP oluşturacaktır.
          </span>
        </div>
      )}

      {overCapacity && (
        <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            Seçilen bilet türünde yalnızca {remainingCapacity} kontenjan kaldı (
            {guests.length} davetiye istendi).
          </span>
        </div>
      )}

      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor="bulk-ticket-type">Bilet Türü</Label>
          <select
            id="bulk-ticket-type"
            value={ticketTypeId}
            onChange={(e) => onTicketTypeChange(e.target.value)}
            className="mt-1.5 flex h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
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

        {!showAdvanced && (
          <>
            <div>
              <Label htmlFor="bulk-recipient">Firma / Kişi Adı</Label>
              <Input
                id="bulk-recipient"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Örn. Let Us Event veya ABC Organizasyon"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="bulk-quantity">Davetiye / Bilet Sayısı</Label>
              <Input
                id="bulk-quantity"
                type="number"
                min={1}
                max={MAX_BULK_QUANTITY}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.min(
                      MAX_BULK_QUANTITY,
                      Math.max(1, Number.parseInt(e.target.value, 10) || 1)
                    )
                  )
                }
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {quantity > 1
                  ? `Her bilet "${recipientName.trim() || '…'} #1" … "#${quantity}" olarak adlandırılır.`
                  : 'Tek davetiye için yalnızca firma/kişi adı kullanılır.'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bulk-email">E-posta</Label>
                <Input
                  id="bulk-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="iletisim@firma.com"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="bulk-phone">İletişim Numarası</Label>
                <Input
                  id="bulk-phone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="05xx xxx xx xx"
                  className="mt-1.5"
                />
              </div>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
        >
          <span>Gelişmiş: farklı misafir listesi (isteğe bağlı)</span>
          <ChevronDown
            className={cn('size-4 transition-transform', showAdvanced && 'rotate-180')}
          />
        </button>

        {showAdvanced && (
          <div>
            <Label htmlFor="bulk-csv">Misafir listesi (Ad, E-posta, Telefon)</Label>
            <textarea
              id="bulk-csv"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`Ahmet Yılmaz, ahmet@email.com, 05551234567\nAyşe Demir, ayse@email.com`}
              className="mt-1.5 min-h-[120px] w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Her satır ayrı misafir. Bu mod aktifken üstteki firma/adet alanları kullanılmaz.
            </p>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={sendEmails}
            onChange={(e) => setSendEmails(e.target.checked)}
            className="size-4 rounded border-border"
          />
          E-posta adresi olanlara ZIP dosyasında PDF davetiyeleri gönder (aynı adrese tek mail)
        </label>

        <Button
          type="button"
          className="w-full"
          disabled={
            disabled ||
            loading ||
            guests.length === 0 ||
            overCapacity ||
            !ticketTypeId
          }
          onClick={() => void handleBulkSend()}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {guests.length} davetiye oluşturuluyor...
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" />
              {guests.length} Davetiye Oluştur
            </>
          )}
        </Button>

        {guests.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            {guests.length} adet QR kodlu PDF oluşturulacak
            {selectedType ? ` · ${selectedType.name}` : ''}
          </p>
        )}

        {success && (
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {lastCreated.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium text-foreground">
              {lastCreated.length} davetiye hazır
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={zipLoading}
              onClick={() => void downloadZip()}
            >
              {zipLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Tüm PDF&apos;leri ZIP İndir
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
