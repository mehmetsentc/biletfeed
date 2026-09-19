'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatTurkeyDateLong } from '@/lib/datetime/istanbul';

export type CouponEventOption = {
  id: string;
  title: string;
  startDate: string;
};

export type CouponRow = {
  id: string;
  code: string;
  assignedLabel: string | null;
  type: string;
  value: number;
  usedCount: number;
  maxUses: number | null;
  active: boolean;
  validUntil: string;
  eventId: string | null;
  eventTitle: string | null;
  eventStartDate: string | null;
};

function eventLabel(title: string, startDate: string) {
  return `${title} — ${formatTurkeyDateLong(startDate)}`;
}

function couponEventLabel(coupon: CouponRow) {
  if (!coupon.eventId || !coupon.eventTitle || !coupon.eventStartDate) {
    return 'Tüm etkinlikler';
  }
  return eventLabel(coupon.eventTitle, coupon.eventStartDate);
}

const EMPTY_FORM = {
  code: '',
  assignedLabel: '',
  eventId: '',
  type: 'percent' as 'percent' | 'fixed',
  value: '10',
  maxUses: '',
  minOrder: '',
  validDays: '30'
};

export function OrganizerCouponsPanel({
  initialCoupons,
  events
}: {
  initialCoupons: CouponRow[];
  events: CouponEventOption[];
}) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState('all');
  const [form, setForm] = useState(EMPTY_FORM);

  const visibleCoupons = useMemo(() => {
    if (listFilter === 'all') return coupons;
    if (listFilter === 'global') return coupons.filter((coupon) => !coupon.eventId);
    return coupons.filter((coupon) => coupon.eventId === listFilter);
  }, [coupons, listFilter]);

  async function createCoupon() {
    setLoading(true);
    setError(null);
    const maxUses = Number(form.maxUses);
    if (!form.eventId) {
      setError('Kuponun geçerli olacağı etkinliği seçin');
      setLoading(false);
      return;
    }
    if (!Number.isFinite(maxUses) || maxUses < 1) {
      setError('Kupon sayısı en az 1 olmalı');
      setLoading(false);
      return;
    }
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + Number(form.validDays || 30));
    const scopedEventId = form.eventId === 'all' ? undefined : form.eventId;

    try {
      const res = await fetch('/api/organizer/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: form.code,
          assignedLabel: form.assignedLabel.trim() || undefined,
          eventId: scopedEventId,
          type: form.type,
          value: Number(form.value),
          maxUses,
          minOrder: form.minOrder ? Number(form.minOrder) : undefined,
          validFrom: validFrom.toISOString(),
          validUntil: validUntil.toISOString()
        })
      });
      const data = (await res.json()) as {
        error?: string;
        coupon?: CouponRow & {
          event?: { id: string; title: string; startDate: string } | null;
        };
      };
      if (!res.ok || !data.coupon) throw new Error(data.error || 'Oluşturulamadı');
      const created = data.coupon;
      setCoupons((prev) => [
        {
          id: created.id,
          code: created.code,
          assignedLabel: created.assignedLabel,
          type: created.type,
          value: created.value,
          usedCount: created.usedCount,
          maxUses: created.maxUses,
          active: created.active,
          validUntil: created.validUntil,
          eventId: created.eventId,
          eventTitle: created.event?.title ?? created.eventTitle ?? null,
          eventStartDate: created.event?.startDate ?? created.eventStartDate ?? null
        },
        ...prev
      ]);
      setForm(EMPTY_FORM);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }

  async function deactivate(id: string) {
    const res = await fetch(`/api/organizer/coupons?id=${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (res.ok) {
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active: false } : c)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Yeni Kupon</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          3 Ekim ve 4 Ekim konserleri ayrı etkinliktir. Kodu hangi güne tanımlarsanız
          yalnızca o etkinliğin satışında geçerli olur.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="coupon-event">Etkinlik</Label>
            <select
              id="coupon-event"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={form.eventId}
              onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value }))}
            >
              <option value="">Etkinlik seçin</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {eventLabel(event.title, event.startDate)}
                </option>
              ))}
              <option value="all">Tüm etkinlikler (eski davranış)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Kod</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="YAZ2026"
            />
          </div>
          <div className="space-y-2">
            <Label>Kupon Adı</Label>
            <Input
              value={form.assignedLabel}
              onChange={(e) => setForm((f) => ({ ...f, assignedLabel: e.target.value }))}
              placeholder="Ahmet Yılmaz / VIP Misafir"
            />
            <p className="text-xs text-muted-foreground">
              Kime tanımlandığını takip etmek için (raporlarda görünür)
            </p>
          </div>
          <div className="space-y-2">
            <Label>Tür</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))
              }
            >
              <option value="percent">Yüzde (%)</option>
              <option value="fixed">Sabit (₺)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Değer</Label>
            <Input
              type="number"
              min={1}
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-max-uses">Kupon sayısı</Label>
            <Input
              id="coupon-max-uses"
              type="number"
              min={1}
              max={100000}
              value={form.maxUses}
              onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
              placeholder="Örn. 50"
              required
            />
            <p className="text-xs text-muted-foreground">
              Bu kod kaç kez kullanılabilir (toplam kullanım limiti)
            </p>
          </div>
          <div className="space-y-2">
            <Label>Geçerlilik (gün)</Label>
            <Input
              type="number"
              min={1}
              value={form.validDays}
              onChange={(e) => setForm((f) => ({ ...f, validDays: e.target.value }))}
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <Button
          className="mt-4"
          disabled={
            loading ||
            !form.code.trim() ||
            !form.eventId ||
            !form.maxUses ||
            Number(form.maxUses) < 1
          }
          onClick={() => void createCoupon()}
        >
          {loading ? 'Oluşturuluyor…' : 'Kupon Oluştur'}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2 sm:w-80">
          <Label htmlFor="coupon-list-filter">Liste filtresi</Label>
          <select
            id="coupon-list-filter"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={listFilter}
            onChange={(e) => setListFilter(e.target.value)}
          >
            <option value="all">Tüm kuponlar</option>
            <option value="global">Yalnızca tüm etkinlikler</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {eventLabel(event.title, event.startDate)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Kod</th>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Kupon Adı</th>
              <th className="p-3 font-medium">İndirim</th>
              <th className="p-3 font-medium">Kullanım / Adet</th>
              <th className="p-3 font-medium">Durum</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {visibleCoupons.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3">{couponEventLabel(c)}</td>
                <td className="p-3 text-muted-foreground">{c.assignedLabel ?? '—'}</td>
                <td className="p-3">
                  {c.type === 'percent' ? `%${c.value}` : `${c.value} ₺`}
                </td>
                <td className="p-3">
                  {c.usedCount}
                  {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                </td>
                <td className="p-3">
                  <Badge variant={c.active ? 'success' : 'secondary'}>
                    {c.active ? 'Aktif' : 'Pasif'}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  {c.active && (
                    <Button variant="ghost" size="sm" onClick={() => void deactivate(c.id)}>
                      Pasifleştir
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {visibleCoupons.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Henüz kupon yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
