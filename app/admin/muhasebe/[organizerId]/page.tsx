import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAccountingOrganizerDetail } from '@/lib/services/accounting-admin';
import { Badge } from '@/components/ui/badge';

function money(amount: number, currency = 'TRY') {
  return `${currency === 'TRY' ? '₺' : currency + ' '}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
}

function EventFinanceTable({
  title,
  rows,
  organizerId
}: {
  title: string;
  rows: Array<{
    eventId: string;
    eventTitle: string;
    startDate: Date;
    status: string;
    grossSales: number;
    serviceFee: number;
    vatAmount: number;
    paymentReceived: number;
    payoutPending: number;
  }>;
  organizerId: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Tarih</th>
              <th className="p-3 font-medium">Durum</th>
              <th className="p-3 font-medium">Satış</th>
              <th className="p-3 font-medium">Hizmet Bedeli</th>
              <th className="p-3 font-medium">KDV</th>
              <th className="p-3 font-medium">Ödeme</th>
              <th className="p-3 font-medium">Hakediş</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.eventId} className="border-b last:border-0 hover:bg-muted/20">
                <td className="p-3">
                  <Link
                    className="font-semibold hover:underline"
                    href={`/admin/muhasebe/${organizerId}/etkinlik/${row.eventId}`}
                  >
                    {row.eventTitle}
                  </Link>
                </td>
                <td className="p-3 whitespace-nowrap">{row.startDate.toLocaleDateString('tr-TR')}</td>
                <td className="p-3">
                  <Badge variant="secondary">{row.status}</Badge>
                </td>
                <td className="p-3">{money(row.grossSales)}</td>
                <td className="p-3">{money(row.serviceFee)}</td>
                <td className="p-3">{money(row.vatAmount)}</td>
                <td className="p-3">{money(row.paymentReceived)}</td>
                <td className="p-3">{money(row.payoutPending)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  Kayıt yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function AdminAccountingOrganizerDetailPage({
  params
}: {
  params: Promise<{ organizerId: string }>;
}) {
  const { organizerId } = await params;
  const detail = await getAccountingOrganizerDetail(organizerId);
  if (!detail) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Link href="/admin/muhasebe" className="text-sm text-muted-foreground hover:underline">
          ← Muhasebe
        </Link>
        <h1 className="text-2xl font-bold">{detail.organizer.name}</h1>
        <p className="text-sm text-muted-foreground">
          {detail.organizer.owner.displayName} ({detail.organizer.owner.email}) • {detail.organizer.slug}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Gelecek etkinlik</p>
          <p className="mt-1 text-2xl font-bold">{detail.upcomingEvents.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Geçmiş etkinlik</p>
          <p className="mt-1 text-2xl font-bold">{detail.pastEvents.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Varsayılan hizmet bedeli</p>
          <p className="mt-1 text-2xl font-bold">
            {detail.organizer.commissionRate != null
              ? `%${(detail.organizer.commissionRate * 100).toLocaleString('tr-TR')}`
              : 'Platform varsayılanı'}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Durum</p>
          <p className="mt-1 text-xl font-semibold">{detail.organizer.status}</p>
        </div>
      </div>

      <EventFinanceTable
        title="Gelecek Etkinlikler"
        rows={detail.upcomingEvents}
        organizerId={detail.organizer.id}
      />
      <EventFinanceTable
        title="Geçmiş Etkinlikler"
        rows={detail.pastEvents}
        organizerId={detail.organizer.id}
      />
    </div>
  );
}
