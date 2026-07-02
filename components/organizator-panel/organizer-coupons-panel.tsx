'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
};

export function OrganizerCouponsPanel({ initialCoupons }: { initialCoupons: CouponRow[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    assignedLabel: '',
    type: 'percent' as 'percent' | 'fixed',
    value: '10',
    maxUses: '',
    minOrder: '',
    validDays: '30'
  });

  async function createCoupon() {
    setLoading(true);
    setError(null);
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + Number(form.validDays || 30));

    try {
      const res = await fetch('/api/organizer/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: form.code,
          assignedLabel: form.assignedLabel.trim() || undefined,
          type: form.type,
          value: Number(form.value),
          maxUses: form.maxUses ? Number(form.maxUses) : undefined,
          minOrder: form.minOrder ? Number(form.minOrder) : undefined,
          validFrom: validFrom.toISOString(),
          validUntil: validUntil.toISOString()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Oluşturulamadı');
      setCoupons((prev) => [data.coupon, ...prev]);
      setForm({
        code: '',
        assignedLabel: '',
        type: 'percent',
        value: '10',
        maxUses: '',
        minOrder: '',
        validDays: '30'
      });
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
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Geçerlilik (gün)</Label>
            <Input
              type="number"
              value={form.validDays}
              onChange={(e) => setForm((f) => ({ ...f, validDays: e.target.value }))}
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <Button className="mt-4" disabled={loading || !form.code} onClick={() => void createCoupon()}>
          {loading ? 'Oluşturuluyor…' : 'Kupon Oluştur'}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Kod</th>
              <th className="p-3 font-medium">Kupon Adı</th>
              <th className="p-3 font-medium">İndirim</th>
              <th className="p-3 font-medium">Kullanım</th>
              <th className="p-3 font-medium">Durum</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3 font-mono">{c.code}</td>
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
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
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
