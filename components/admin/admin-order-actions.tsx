'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  orderId: string;
  status: string;
  total: number;
};

export function AdminOrderActions({ orderId, status, total }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (status !== 'paid') {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  async function run(
    body: Record<string, unknown>,
    confirmText: string
  ): Promise<void> {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body)
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        needsBankRefund?: boolean;
      };
      if (!res.ok) {
        if (data.needsBankRefund) {
          const holder = window.prompt('Hesap sahibi (banka iadesi)');
          const iban = window.prompt('IBAN');
          if (holder && iban) {
            await run(
              {
                ...body,
                fallbackBankRefund: true,
                bankDetails: { accountHolder: holder, iban }
              },
              'Banka iade talebi ile devam edilsin mi?'
            );
            return;
          }
        }
        setMsg(data.error ?? 'İşlem başarısız');
        return;
      }
      setMsg(data.message ?? 'Tamam');
      router.refresh();
    } catch {
      setMsg('Ağ hatası');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          className="h-8 text-xs"
          onClick={() =>
            void run(
              { cancelOnly: true, reason: 'Admin bilet iptali' },
              'Biletler parasız iptal edilsin mi? (stok açılır)'
            )
          }
        >
          İptal
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={busy}
          className="h-8 text-xs"
          onClick={() =>
            void run(
              {
                reason: 'Admin iade',
                fallbackBankRefund: total > 0
              },
              total > 0
                ? 'Ödeme iadesi + bilet iptali yapılsın mı?'
                : 'Sipariş iade edilsin mi?'
            )
          }
        >
          İade
        </Button>
      </div>
      {msg ? (
        <p className="max-w-[160px] text-right text-[10px] text-muted-foreground">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
