import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { getAccountingOrganizerEventDetail } from '@/lib/services/accounting-admin';
import { adminHref } from '@/lib/config/domain';

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
        <Link href={adminHref(`/muhasebe/${organizerId}`)} className="text-sm text-muted-foreground hover:underline">
          ← Organizatör Detayı
        </Link>
        <h1 className="text-2xl font-bold">{detail.event.title}</h1>
        <p className="text-sm text-muted-foreground">
          {detail.event.startDate.toLocaleDateString('tr-TR')} • {detail.event.organizer.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Platform komisyonu"
          value={`%${detail.rates.commissionRatePercent}`}
          hint={
            detail.rates.commissionRateCustom
              ? 'Organizatöre özel oran'
              : 'Platform varsayılan oranı'
          }
        />
        <MetricCard
          label={`KDV oranı (%${detail.rates.vatRate})`}
          value={money(detail.metrics.vatAmount)}
          hint="Brüt satıştan ayrıştırılan KDV"
        />
        <MetricCard label="Toplam satış" value={money(detail.metrics.grossSales)} />
        <MetricCard
          label={`Hizmet bedeli (%${detail.rates.commissionRatePercent})`}
          value={money(detail.metrics.serviceFee)}
        />
        <MetricCard label="Ödeme alındı" value={money(detail.metrics.paymentReceived)} />
        <MetricCard label="Hakediş (Net)" value={money(detail.metrics.payoutNet)} />
        <MetricCard label="Satılan bilet" value={String(detail.metrics.ticketsSold)} />
        <MetricCard label="Gönderilen davetiye" value={String(detail.metrics.invitationsSent)} />
      </div>

      {detail.pnl && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Etkinlik P&amp;L</h2>
            <p className="text-sm text-muted-foreground">
              Tahsilat, komisyon, hakediş ve giderlerden net
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Gelir (tahsilat)" value={money(detail.pnl.revenue)} />
            <MetricCard
              label="İndirim"
              value={money(detail.pnl.discounts)}
              hint="Kupon / indirim toplamı"
            />
            <MetricCard label="Komisyon" value={money(detail.pnl.commission)} />
            <MetricCard label="Gider toplamı" value={money(detail.pnl.expenseTotal)} />
            <MetricCard label="Ödenen hakediş" value={money(detail.pnl.payoutPaid)} />
            <MetricCard label="Bekleyen hakediş" value={money(detail.pnl.payoutPending)} />
            <MetricCard
              label="Platform net"
              value={money(detail.pnl.platformNet)}
              hint="Komisyon − giderler"
            />
            <MetricCard
              label="Organizatör net"
              value={money(detail.pnl.organizerNet)}
              hint="Hakediş − giderler"
            />
          </div>
        </section>
      )}

      {detail.expenses.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Etkinlik giderleri</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b bg-muted/50 text-left">
                <tr>
                  <th className="p-3 font-medium">Tarih</th>
                  <th className="p-3 font-medium">Kategori</th>
                  <th className="p-3 font-medium">Açıklama</th>
                  <th className="p-3 font-medium">Tutar</th>
                  <th className="p-3 font-medium">KDV</th>
                </tr>
              </thead>
              <tbody>
                {detail.expenses.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="p-3">{row.incurredAt.toLocaleDateString('tr-TR')}</td>
                    <td className="p-3">
                      <Badge variant="secondary">{row.category}</Badge>
                    </td>
                    <td className="p-3">{row.description}</td>
                    <td className="p-3 font-medium">{money(row.amount, row.currency)}</td>
                    <td className="p-3">{money(row.vatAmount, row.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Bilet / davetiye kategorileri</h2>
          <p className="text-sm text-muted-foreground">
            Satılan bilet ve gönderilen davetiye, kategori bazında
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Kategori</th>
                <th className="p-3 font-medium">Birim fiyat</th>
                <th className="p-3 font-medium">Satılan</th>
                <th className="p-3 font-medium">Davetiye</th>
                <th className="p-3 font-medium">Kapasite</th>
                <th className="p-3 font-medium">Satış tutarı (net)</th>
              </tr>
            </thead>
            <tbody>
              {detail.categories.map((cat) => (
                <tr key={cat.ticketTypeId} className="border-b last:border-0">
                  <td className="p-3 font-medium">{cat.name}</td>
                  <td className="p-3">{money(cat.unitPrice)}</td>
                  <td className="p-3">{cat.soldCount}</td>
                  <td className="p-3">{cat.invitationCount}</td>
                  <td className="p-3">
                    {cat.soldCount + cat.invitationCount} / {cat.capacity}
                  </td>
                  <td className="p-3 font-medium">{money(cat.soldRevenue)}</td>
                </tr>
              ))}
              {detail.categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Bu etkinlikte bilet kategorisi yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Satış detayları</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Sipariş</th>
                <th className="p-3 font-medium">Alıcı</th>
                <th className="p-3 font-medium">Kategori</th>
                <th className="p-3 font-medium">Sağlayıcı</th>
                <th className="p-3 font-medium">Organizatör geliri</th>
                <th className="p-3 font-medium">Hizmet bedeli</th>
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
                  <td className="p-3">
                    {order.categories.length > 0
                      ? order.categories.map((c) => `${c.name} ×${c.quantity}`).join(', ')
                      : '—'}
                  </td>
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
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
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
                  <td className="p-3">
                    {row.scheduledAt ? row.scheduledAt.toLocaleDateString('tr-TR') : '—'}
                  </td>
                  <td className="p-3">
                    {row.paidAt ? row.paidAt.toLocaleDateString('tr-TR') : '—'}
                    {row.paymentRef ? (
                      <p className="text-xs text-muted-foreground">Ref: {row.paymentRef}</p>
                    ) : null}
                  </td>
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

function MetricCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
