'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { EventJoyHeader } from '@/components/eventjoy/mobile-shell';
import type { EventJoyBudgetItem } from '@/lib/eventjoy/types';

export function BudgetClient({
  eventId,
  items,
  budget,
  spent
}: {
  eventId: string;
  items: EventJoyBudgetItem[];
  budget: number;
  spent: number;
}) {
  const pending = items
    .filter((i) => i.status === 'pending')
    .reduce((a, i) => a + i.amount - i.paid, 0);
  const paid = items
    .filter((i) => i.status === 'paid')
    .reduce((a, i) => a + i.paid, 0);

  return (
    <div className="min-h-[calc(100vh-7rem)] pb-8">
      <EventJoyHeader title="Bütçe" backHref={`/eventjoy/etkinlik/${eventId}`} />

      <div className="grid grid-cols-3 gap-2 p-4 text-center">
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-lg font-bold">₺{budget.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-muted-foreground">Toplam</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-lg font-bold text-emerald-600">₺{paid.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-muted-foreground">Ödendi</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-lg font-bold text-amber-600">₺{pending.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-muted-foreground">Bekleyen</p>
        </div>
      </div>

      <div className="px-4">
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--bf-accent-ink)]">
          <Plus className="size-4" />
          Bütçe Kalemi Ekle
        </span>
      </div>

      <ul className="mt-4 divide-y">
        {items.length === 0 ? (
          <li className="px-4 py-12 text-center text-sm text-muted-foreground">
            Henüz bütçe kalemi yok
          </li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.category}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">₺{item.amount.toLocaleString('tr-TR')}</p>
                <p
                  className={`text-xs font-medium ${
                    item.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {item.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
