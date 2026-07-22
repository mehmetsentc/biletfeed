'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CATEGORIES = [
  { value: 'psp_fee', label: 'Ödeme komisyonu' },
  { value: 'marketing', label: 'Pazarlama' },
  { value: 'venue', label: 'Mekan' },
  { value: 'staff', label: 'Personel' },
  { value: 'software', label: 'Yazılım' },
  { value: 'other', label: 'Diğer' }
] as const;

export type ExpenseRow = {
  id: string;
  category: string;
  description: string;
  amountLabel: string;
  vatLabel: string;
  eventTitle: string;
  organizerName: string;
  incurredAtLabel: string;
};

function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function AccountingExpensesPanel({ rows }: { rows: ExpenseRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [vatAmount, setVatAmount] = useState('0');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['value']>('other');
  const [eventId, setEventId] = useState('');
  const [organizerId, setOrganizerId] = useState('');

  async function createExpense(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/accounting/expenses', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          amount: Number(amount),
          vatAmount: Number(vatAmount) || 0,
          category,
          eventId: eventId.trim() || null,
          organizerId: organizerId.trim() || null
        })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Gider kaydedilemedi');
        return;
      }
      setDescription('');
      setAmount('');
      setVatAmount('0');
      setEventId('');
      setOrganizerId('');
      setCategory('other');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeExpense(id: string) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/accounting/expenses/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Silinemedi');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={createExpense}
        className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
          <Label htmlFor="exp-desc">Açıklama</Label>
          <Input
            id="exp-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Örn. Meta reklam — İstanbul festival"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-amount">Tutar (₺)</Label>
          <Input
            id="exp-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-vat">KDV (₺)</Label>
          <Input
            id="exp-vat"
            type="number"
            step="0.01"
            min="0"
            value={vatAmount}
            onChange={(e) => setVatAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-cat">Kategori</Label>
          <select
            id="exp-cat"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as (typeof CATEGORIES)[number]['value'])
            }
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-event">Etkinlik ID (opsiyonel)</Label>
          <Input
            id="exp-event"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="UUID"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-org">Organizatör ID (opsiyonel)</Label>
          <Input
            id="exp-org"
            value={organizerId}
            onChange={(e) => setOrganizerId(e.target.value)}
            placeholder="UUID"
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={busy}>
            Gider ekle
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive sm:col-span-2 lg:col-span-3">{error}</p>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Tarih</th>
              <th className="p-3 font-medium">Kategori</th>
              <th className="p-3 font-medium">Açıklama</th>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Organizatör</th>
              <th className="p-3 font-medium">Tutar</th>
              <th className="p-3 font-medium">KDV</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap">{row.incurredAtLabel}</td>
                <td className="p-3">
                  <Badge variant="secondary">{categoryLabel(row.category)}</Badge>
                </td>
                <td className="p-3">{row.description}</td>
                <td className="p-3">{row.eventTitle}</td>
                <td className="p-3">{row.organizerName}</td>
                <td className="p-3 font-medium">{row.amountLabel}</td>
                <td className="p-3">{row.vatLabel}</td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => removeExpense(row.id)}
                  >
                    Sil
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  Henüz gider kaydı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
