'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PRINT_TICKET_MAX } from '@/lib/tickets/print/constants';

type CategoryOption = {
  id: string;
  name: string;
  capacity: number;
  sold: number;
};

type BatchRow = {
  orderId: string;
  quantity: number;
  ticketTypeName: string;
  createdAt: string;
  pdfUrl?: string;
};

function pdfHref(eventId: string, orderId: string): string {
  return `/api/organizer/events/${eventId}/print-tickets/${orderId}/pdf`;
}

function formatBatchDate(value: string): string {
  return new Date(value).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function PrintTicketBatchPanel({
  eventId,
  cancelled,
  categories
}: {
  eventId: string;
  cancelled: boolean;
  categories: CategoryOption[];
}) {
  const [ticketTypeId, setTicketTypeId] = useState(categories[0]?.id ?? '');
  const [quantity, setQuantity] = useState(String(Math.min(PRINT_TICKET_MAX, 500)));
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraSold, setExtraSold] = useState<Record<string, number>>({});

  function remainingFor(category: CategoryOption): number {
    return Math.max(0, category.capacity - category.sold - (extraSold[category.id] ?? 0));
  }

  const selected = categories.find((category) => category.id === ticketTypeId) ?? null;
  const remaining = selected ? remainingFor(selected) : 0;
  const maxQty = Math.min(PRINT_TICKET_MAX, remaining);

  const parsedQty = useMemo(() => {
    const value = Number(quantity);
    return Number.isInteger(value) ? value : NaN;
  }, [quantity]);

  useEffect(() => {
    let active = true;
    fetch(`/api/organizer/events/${eventId}/print-tickets`, { credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) return;
        const body = (await res.json()) as { batches?: BatchRow[] };
        if (active) setBatches(body.batches ?? []);
      })
      .catch(() => {
        /* liste boş kalır, oluşturma yine denenebilir */
      })
      .finally(() => {
        if (active) setLoadingList(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  useEffect(() => {
    setQuantity(String(maxQty));
  }, [ticketTypeId, maxQty]);

  async function createBatch() {
    setError(null);
    if (!selected) {
      setError('Bilet türü seçin');
      return;
    }
    if (!Number.isInteger(parsedQty) || parsedQty < 1 || parsedQty > maxQty) {
      setError(
        maxQty > 0
          ? `Adet 1 ile ${maxQty} arasında olmalı`
          : 'Bu bilet türünde kontenjan kalmadı'
      );
      return;
    }
    const confirmed = window.confirm(
      `${parsedQty} bilet kontenjandan düşülecek. Her bilete kapıda okunan ayrı bir QR yazılır. Ciroya eklenmez. Devam edilsin mi?`
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/organizer/events/${eventId}/print-tickets`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketTypeId: selected.id, quantity: parsedQty })
      });
      const body = (await res.json()) as { error?: string; orderId?: string; pdfUrl?: string };
      if (!res.ok || !body.orderId) {
        setError(body.error || 'Baskı bileti oluşturulamadı');
        return;
      }
      const row: BatchRow = {
        orderId: body.orderId,
        quantity: parsedQty,
        ticketTypeName: selected.name,
        createdAt: new Date().toISOString(),
        pdfUrl: body.pdfUrl
      };
      setExtraSold((current) => ({
        ...current,
        [selected.id]: (current[selected.id] ?? 0) + parsedQty
      }));
      setBatches((current) => [row, ...current]);
      const link = document.createElement('a');
      link.href = body.pdfUrl || pdfHref(eventId, body.orderId);
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError('Bağlantı kurulamadı. Tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Printer className="size-4 text-foreground" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Baskı bileti</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Matbaaya verilecek A4 dosya. Her sayfada 3 bilet vardır; her biletin ön yüzünü
            hemen ardından arka yüzü gelir. QR kod kapı tarayıcısında geçerlidir. Üretilen
            biletler kontenjandan düşer, satış cirosuna yazılmaz. Bir partide en fazla{' '}
            {PRINT_TICKET_MAX} bilet.
          </p>
        </div>
      </div>

      <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground">
        <li>PDF’yi çift yüz yazdırın.</li>
        <li>Kağıdı uzun kenardan çevirin; üstteki bilet arkada da üstte kalır.</li>
        <li>Köşelerdeki kesim çizgilerinden kesin. Sayfa kenarındaki yazı bilete girmez.</li>
      </ol>

      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_140px_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="print-ticket-type">Bilet türü</Label>
          <select
            id="print-ticket-type"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={ticketTypeId}
            onChange={(event) => setTicketTypeId(event.target.value)}
            disabled={cancelled || categories.length === 0}
          >
            {categories.length === 0 ? (
              <option value="">Bilet türü yok</option>
            ) : (
              categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} · kalan {remainingFor(category)}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="print-ticket-qty">Adet</Label>
          <Input
            id="print-ticket-qty"
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value.replace(/[^\d]/g, '').slice(0, 3))}
            disabled={cancelled || maxQty < 1}
          />
        </div>
        <Button
          type="button"
          className="gap-2"
          disabled={cancelled || submitting || maxQty < 1}
          onClick={() => void createBatch()}
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
          PDF oluştur
        </Button>
      </div>

      {cancelled ? (
        <p className="mt-3 text-xs text-muted-foreground">
          İptal edilmiş etkinliğe yeni baskı partisi eklenemez. Eski dosyalar indirilebilir.
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <div className="mt-5 border-t border-border pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Üretilen partiler
        </h3>
        {loadingList ? (
          <p className="mt-2 text-sm text-muted-foreground">Yükleniyor…</p>
        ) : batches.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Henüz baskı partisi yok.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {batches.map((batch) => (
              <li key={batch.orderId} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {batch.quantity} bilet · {batch.ticketTypeName}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatBatchDate(batch.createdAt)}</p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
                  <a href={batch.pdfUrl || pdfHref(eventId, batch.orderId)}>
                    <Download className="size-3.5" />
                    PDF
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Aynı partinin PDF’ini yeniden indirmek yeni bilet ve yeni QR üretmez.
        </p>
      </div>
    </section>
  );
}
