import { getAdminOrders } from '@/lib/services/admin-dashboard';
import { Badge } from '@/components/ui/badge';

export default async function AdminOrdersPage() {
  let orders: Awaited<ReturnType<typeof getAdminOrders>> = [];
  let loadError: string | null = null;

  try {
    orders = await getAdminOrders();
  } catch (e) {
    loadError =
      e instanceof Error ? e.message : 'Siparişler yüklenemedi. Veritabanı şeması güncel olmayabilir.';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Siparişler</h1>
        <p className="text-muted-foreground">Platform siparişleri</p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Tarih</th>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Müşteri</th>
              <th className="p-3 font-medium">Organizatör</th>
              <th className="p-3 font-medium">Tutar</th>
              <th className="p-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap text-muted-foreground">
                  {order.createdAt.toLocaleDateString('tr-TR')}
                </td>
                <td className="p-3">{order.event?.title ?? '—'}</td>
                <td className="p-3">{order.user?.displayName ?? order.user?.email ?? '—'}</td>
                <td className="p-3">{order.organizer?.name ?? '—'}</td>
                <td className="p-3">₺{order.total.toLocaleString('tr-TR')}</td>
                <td className="p-3">
                  <Badge variant={order.status === 'paid' ? 'success' : 'secondary'}>
                    {order.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Sipariş yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
