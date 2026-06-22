'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminOrder {
  id: string;
  status: string;
  total: number;
  commission: number;
  provider: string;
  paidAt: string | null;
  createdAt: string;
  user: { email: string; displayName: string };
  event: { title: string; slug: string };
  organizer: { name: string };
}

export function AdminOrdersPanel() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yüklenemedi');
      setOrders(data.orders || []);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function refund(orderId: string) {
    if (!confirm('Bu siparişi iade etmek istiyor musunuz?')) return;
    setMessage(null);
    const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Admin iade' })
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'İade başarısız');
      return;
    }
    setMessage(data.message);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {orders.length} sipariş · Ödeme kuruluşu iadeleri API bağlandığında
          otomatik işlenecek
        </p>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {message && (
        <div className="rounded-md border bg-muted/50 p-3 text-sm">{message}</div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="p-3">Tarih</th>
              <th className="p-3">Etkinlik</th>
              <th className="p-3">Kullanıcı</th>
              <th className="p-3">Tutar</th>
              <th className="p-3">Durum</th>
              <th className="p-3">Sağlayıcı</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap">
                  {new Date(o.createdAt).toLocaleString('tr-TR')}
                </td>
                <td className="p-3">{o.event.title}</td>
                <td className="p-3">{o.user.email}</td>
                <td className="p-3">{o.total} ₺</td>
                <td className="p-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {o.status}
                  </span>
                </td>
                <td className="p-3">{o.provider}</td>
                <td className="p-3">
                  {o.status === 'paid' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refund(o.id)}
                    >
                      İade
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Henüz sipariş yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
