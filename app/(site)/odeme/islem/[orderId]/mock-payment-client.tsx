'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MockPaymentClientProps {
  orderId: string;
  sessionId?: string;
  total: number;
  eventTitle: string;
}

export function MockPaymentClient({
  orderId,
  sessionId,
  total,
  eventTitle
}: MockPaymentClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<'paid' | 'failed' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function complete(status: 'paid' | 'failed') {
    setLoading(status);
    setError(null);

    try {
      const res = await fetch('/api/payments/mock/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, sessionId, status })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'İşlem başarısız');
      }

      if (status === 'paid') {
        router.push(`/odeme/basarili?order=${orderId}`);
      } else {
        router.push(`/odeme/basarisiz?order=${orderId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız');
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <CreditCard className="size-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Test ödeme sayfası</p>
          <h1 className="text-lg font-bold">{total} ₺</h1>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{eventTitle}</p>

      <div className="mt-6 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">
        Bu sayfa yalnızca geliştirme içindir. Canlı ortamda güvenli banka ödeme
        sayfası açılır.
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        <Button
          onClick={() => complete('paid')}
          disabled={loading !== null}
          className="w-full"
        >
          {loading === 'paid' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Ödemeyi Simüle Et (Başarılı)'
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => complete('failed')}
          disabled={loading !== null}
          className="w-full"
        >
          {loading === 'failed' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Başarısız Ödeme Simüle Et'
          )}
        </Button>
      </div>
    </div>
  );
}
