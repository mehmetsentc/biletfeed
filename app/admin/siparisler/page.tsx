import { Suspense } from 'react';
import { getAdminOrders, getAdminOrderEventList, type OrderKategori } from '@/lib/services/admin-dashboard';
import { Badge } from '@/components/ui/badge';
import { OrdersFilter } from '@/components/admin/orders-filter';

interface PageProps {
  searchParams: Promise<{ eventId?: string; kategori?: string }>;
}

function orderKategori(order: {
  total: number;
  purchasedTickets: { invitation: { id: string } | null }[];
}): { label: string; variant: 'success' | 'secondary' | 'outline' } {
  const hasInvitation = order.purchasedTickets.some((pt) => pt.invitation !== null);
  if (hasInvitation) return { label: '✉️ Davetiye', variant: 'outline' };
  if (order.total > 0) return { label: '💳 Ücretli', variant: 'success' };
  return { label: '🎟 Ücretsiz', variant: 'secondary' };
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    paid: 'Ödendi',
    pending: 'Bekliyor',
    cancelled: 'İptal',
    refunded: 'İade',
    expired: 'Süresi Doldu'
  };
  return map[status] ?? status;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { eventId = '', kategori = '' } = await searchParams;

  const [orders, events] = await Promise.all([
    getAdminOrders({
      eventId: eventId || undefined,
      kategori: (kategori as OrderKategori) || undefined,
      limit: 200
    }).catch(() => []),
    getAdminOrderEventList().catch(() => [])
  ]);

  // Özet istatistikler (tüm siparişler üzerinden, filtreden bağımsız)
  const allOrders = await getAdminOrders({ limit: 1000 }).catch(() => []);
  const stats = {
    toplam: allOrders.length,
    ucretli: allOrders.filter((o) => o.total > 0).length,
    ucretsiz: allOrders.filter(
      (o) => o.total === 0 && !o.purchasedTickets.some((pt) => pt.invitation !== null)
    ).length,
    davetiye: allOrders.filter((o) =>
      o.purchasedTickets.some((pt) => pt.invitation !== null)
    ).length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Siparişler</h1>
        <p className="text-muted-foreground">Platform siparişleri</p>
      </div>

      <Suspense>
        <OrdersFilter
          events={events}
          currentEventId={eventId}
          currentKategori={kategori}
          stats={stats}
        />
      </Suspense>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Tarih</th>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Bilet Kategorisi</th>
              <th className="p-3 font-medium">Adet</th>
              <th className="p-3 font-medium">Müşteri</th>
              <th className="p-3 font-medium">Organizatör</th>
              <th className="p-3 font-medium">Tutar</th>
              <th className="p-3 font-medium">Tür</th>
              <th className="p-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const kat = orderKategori(order);
              const ticketNames = order.items.map((i) => i.ticketType.name).join(', ');
              const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
              return (
                <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="p-3 max-w-[200px] truncate font-medium">
                    {order.event?.title ?? '—'}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {ticketNames || '—'}
                  </td>
                  <td className="p-3 text-center">{totalQty || '—'}</td>
                  <td className="p-3">
                    {order.user?.displayName ?? order.user?.email ?? '—'}
                  </td>
                  <td className="p-3">{order.organizer?.name ?? '—'}</td>
                  <td className="p-3 font-medium">
                    {order.total > 0 ? `₺${order.total.toLocaleString('tr-TR')}` : '₺0'}
                  </td>
                  <td className="p-3">
                    <Badge variant={kat.variant}>{kat.label}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        order.status === 'paid'
                          ? 'success'
                          : order.status === 'cancelled'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {statusLabel(order.status)}
                    </Badge>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  Bu kriterlere uygun sipariş yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-right">
        {orders.length} sipariş gösteriliyor
      </p>
    </div>
  );
}
