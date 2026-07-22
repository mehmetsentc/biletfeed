'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type PayoutActionRow = {
  id: string;
  organizerName: string;
  eventTitle: string;
  grossLabel: string;
  commissionLabel: string;
  netLabel: string;
  status: string;
  paymentRef: string | null;
};

export function PayoutActionsTable({ rows }: { rows: PayoutActionRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function post(payoutId: string, path: 'mark-paid' | 'cancel', body?: object) {
    setBusyId(payoutId);
    setErrors((p) => ({ ...p, [payoutId]: '' }));
    try {
      const res = await fetch(`/api/admin/accounting/payouts/${payoutId}/${path}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : '{}'
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErrors((p) => ({
          ...p,
          [payoutId]: data.error || 'İşlem başarısız'
        }));
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Hakediş kaydı yok.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[980px] text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th className="p-3 font-medium">Organizatör</th>
            <th className="p-3 font-medium">Etkinlik</th>
            <th className="p-3 font-medium">Brüt</th>
            <th className="p-3 font-medium">Komisyon</th>
            <th className="p-3 font-medium">Net</th>
            <th className="p-3 font-medium">Durum</th>
            <th className="p-3 font-medium">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const actionable = row.status === 'pending' || row.status === 'scheduled';
            return (
              <tr key={row.id} className="border-b last:border-0 align-top">
                <td className="p-3">{row.organizerName}</td>
                <td className="p-3">{row.eventTitle}</td>
                <td className="p-3">{row.grossLabel}</td>
                <td className="p-3">{row.commissionLabel}</td>
                <td className="p-3 font-medium">{row.netLabel}</td>
                <td className="p-3">
                  <Badge
                    variant={
                      row.status === 'paid'
                        ? 'success'
                        : row.status === 'cancelled' || row.status === 'failed'
                          ? 'secondary'
                          : 'secondary'
                    }
                  >
                    {row.status}
                  </Badge>
                  {row.paymentRef && (
                    <p className="mt-1 text-xs text-muted-foreground">Ref: {row.paymentRef}</p>
                  )}
                  {errors[row.id] && (
                    <p className="mt-1 text-xs text-destructive">{errors[row.id]}</p>
                  )}
                </td>
                <td className="p-3">
                  {actionable ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        className="h-8 w-40"
                        placeholder="Ödeme ref"
                        value={refs[row.id] ?? ''}
                        onChange={(e) =>
                          setRefs((p) => ({ ...p, [row.id]: e.target.value }))
                        }
                      />
                      <Button
                        size="sm"
                        disabled={busyId === row.id || !(refs[row.id] ?? '').trim()}
                        onClick={() =>
                          post(row.id, 'mark-paid', {
                            paymentRef: (refs[row.id] ?? '').trim()
                          })
                        }
                      >
                        Ödendi
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === row.id}
                        onClick={() => post(row.id, 'cancel', { reason: 'admin_cancel' })}
                      >
                        İptal
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
