'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  orderId: string;
  status: string;
};

export function OrganizerOrderActions({ orderId, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (status !== 'paid') {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  async function run(action: 'request_refund' | 'cancel_tickets') {
    const reason =
      window.prompt(
        action === 'cancel_tickets'
          ? 'İptal nedeni (opsiyonel)'
          : 'İade talep nedeni'
      ) ?? '';
    if (action === 'request_refund' && !reason.trim()) {
      setMsg('İade talebi için neden gerekli');
      return;
    }
    if (
      !window.confirm(
        action === 'cancel_tickets'
          ? 'Biletler parasız iptal edilsin mi?'
          : 'Admin onayına iade talebi gönderilsin mi?'
      )
    ) {
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/organizer/orders/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          orderId,
          action,
          reason: reason.trim() || undefined
        })
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
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
          onClick={() => void run('cancel_tickets')}
        >
          İptal
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={busy}
          className="h-8 text-xs"
          onClick={() => void run('request_refund')}
        >
          İade talebi
        </Button>
      </div>
      {msg ? (
        <p className="max-w-[140px] text-right text-[10px] text-muted-foreground">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
