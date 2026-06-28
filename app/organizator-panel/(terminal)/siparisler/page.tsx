import { redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerOrders } from '@/lib/services/organizer-dashboard';
import { Badge } from '@/components/ui/badge';

export default async function OrganizatorOrdersPage() {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const orders = await getOrganizerOrders(organizer.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Siparişler</h1>
        <p className="text-sm text-muted-foreground">Sipariş geçmişi ve ödeme durumları</p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted text-left">
            <tr>
              <th className="p-3 font-medium">Tarih</th>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Müşteri</th>
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
                <td className="p-3">{order.event.title}</td>
                <td className="p-3">{order.user.displayName}</td>
                <td className="p-3 font-medium">₺{order.total.toLocaleString('tr-TR')}</td>
                <td className="p-3">
                  <Badge variant={order.status === 'paid' ? 'success' : 'secondary'}>
                    {order.status === 'paid' ? 'Ödendi' : order.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Henüz sipariş yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
