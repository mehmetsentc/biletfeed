'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function AcceptTransferClient({ transferId }: { transferId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/transfers/${transferId}/accept`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/giris?redirect=/bilet/devir/${transferId}`);
          return;
        }
        throw new Error(data.error || 'Kabul edilemedi');
      }
      router.push(`/biletlerim/${data.ticketId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border bg-card p-6 text-center">
      <h1 className="text-xl font-bold">Bilet Devri</h1>
      <p className="text-sm text-muted-foreground">
        Size devredilen bileti kabul etmek için giriş yapmış olmanız gerekir.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" disabled={loading} onClick={() => void accept()}>
        {loading ? 'İşleniyor…' : 'Bileti Kabul Et'}
      </Button>
    </div>
  );
}
