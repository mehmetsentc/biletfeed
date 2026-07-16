import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { getAccountingOrganizerEventDetail } from '@/lib/services/accounting-admin';

function money(amount: number, currency = 'TRY') {
  return `${currency === 'TRY' ? '₺' : currency + ' '}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
}

export default async function AdminAccountingOrganizerEventDetailPage({
  params
}: {
  params: Promise<{ organizerId: string; eventId: string }>;
}) {
  const { organizerId, eventId } = await params;
  const detail = await getAccountingOrganizerEventDetail(organizerId, eventId);
  if (!detail) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Link href={`/admin/muhasebe/${organizerId}`} className="text-sm text-muted-foreground hover:underline">
          ← Organizatör Detayı
        </Link>
        <h1 className="text-2xl font-bold">{detail.event.title}</h1>
        <p className="text-sm text-muted-foreground">
          {detail.event.startDate.toLocaleDateString('tr-TR')} • {detail.event.organizer.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Toplam satış" value={money(detail.metrics.grossSales)} />
        <MetricCard label="Hizmet bedeli" value={money(detail.metrics.serviceFee)} />
        <MetricCard
          label={`KDV (%${detail.metrics.vatRate})`}
          value={money(detail.metrics.vatAmount)}
        />
        <MetricCard label="Ödeme alındı" value={money(detail.metrics.paymentReceived)} />
        <MetricCard label="Hakediş (Net)" value={money(detail.metrics.payoutNet)} />
        <MetricCard label="Ödenen hakediş" value={money(detail.metrics.payoutPaid)} />
        <MetricCard label="Bekleyen hakediş" value={money(detail.metrics.payoutPending)} />
        <MetricCard label="Ödenen sipariş" value={String(detail.metrics.paidOrderCount)} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Satış detayları</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Sipariş</th>
                <th className="p-3 font-medium">Alıcı</th>
                <th className="p-3 font-medium">Sağlayıcı</th>
                <th className="p-3 font-medium">Organizatör Geliri</th>
                <th className="p-3 font-medium">Hizmet Bedeli</th>
                <th className="p-3 font-medium">Toplam</th>
                <th className="p-3 font-medium">Durum</th>
                <th className="p-3 font-medium">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {detail.recentOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                  <td className="p-3">{order.buyerName}</td>
                  <td className="p-3">{order.paymentProvider}</td>
                  <td className="p-3">{money(order.subtotal)}</td>
                  <td className="p-3">{money(order.serviceFee)}</td>
                  <td className="p-3">{money(order.total)}</td>
                  <td className="p-3">
                    <Badge variant="secondary">{order.status}</Badge>
                  </td>
                  <td className="p-3 whitespace-nowrap">{order.paidAt.toLocaleString('tr-TR')}</td>
                </tr>
              ))}
              {detail.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Bu etkinlikte ödenmiş sipariş yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Hakediş kayıtları</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[840px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Kayıt</th>
                <th className="p-3 font-medium">Brüt</th>
                <th className="p-3 font-medium">Komisyon</th>
                <th className="p-3 font-medium">Net</th>
                <th className="p-3 font-medium">Durum</th>
                <th className="p-3 font-medium">Planlanan</th>
                <th className="p-3 font-medium">Ödenen</th>
              </tr>
            </thead>
            <tbody>
              {detail.payouts.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="p-3 font-mono text-xs">{row.id.slice(0, 8)}</td>
                  <td className="p-3">{money(row.grossAmount)}</td>
                  <td className="p-3">{money(row.commissionAmount)}</td>
                  <td className="p-3">{money(row.netAmount)}</td>
                  <td className="p-3">
                    <Badge variant="secondary">{row.status}</Badge>
                  </td>
                  <td className="p-3">{row.scheduledAt ? row.scheduledAt.toLocaleDateString('tr-TR') : '—'}</td>
                  <td className="p-3">{row.paidAt ? row.paidAt.toLocaleDateString('tr-TR') : '—'}</td>
                </tr>
              ))}
              {detail.payouts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Hakediş kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
