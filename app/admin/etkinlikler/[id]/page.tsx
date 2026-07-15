import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EventEditorForm } from '@/components/admin/event-editor-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CancelEventButton } from '@/components/admin/cancel-event-button';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { eventInclude, toMockEvent } from '@/lib/mappers/event';
import { Ticket, Users, TrendingUp, Ban } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEventEditPage({ params }: PageProps) {
  const { id } = await params;
  await ensureDbConnection();

  const [event, ticketTypes] = await Promise.all([
    prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: eventInclude
    }),
    prisma.ticketType.findMany({
      where: { eventId: id, deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
        quantity: true,
        sold: true,
        capacity: true,
        status: true,
        _count: { select: { purchasedTickets: true } }
      }
    })
  ]);

  if (!event) notFound();

  const mock = toMockEvent(event);

  const totalSold = ticketTypes.reduce((acc, t) => acc + t.sold, 0);
  const totalCapacity = ticketTypes.reduce((acc, t) => acc + t.capacity, 0);
  const totalRevenue = ticketTypes.reduce((acc, t) => acc + t.sold * t.price, 0);
  const isCancelled = event.status === 'cancelled';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{mock.title}</h1>
          <p className="text-sm text-muted-foreground">
            {mock.organizer} · {mock.city}
          </p>
          {isCancelled && (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-destructive">
              <Ban className="size-3.5" />
              Bu etkinlik yönetici tarafından iptal edilmiştir
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/etkinlikler">← Listeye dön</Link>
          </Button>
          {!isCancelled && (
            <CancelEventButton eventId={id} eventTitle={mock.title} variant="detail" />
          )}
        </div>
      </div>

      {/* Bilet satış özeti */}
      {ticketTypes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Bilet Satışları</h2>

          {/* Özet kartlar */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Ticket className="size-4" />
                Toplam Satış
              </div>
              <p className="mt-1 text-2xl font-bold">{totalSold.toLocaleString('tr-TR')}</p>
              <p className="text-xs text-muted-foreground">/ {totalCapacity.toLocaleString('tr-TR')} kapasite</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="size-4" />
                Doluluk
              </div>
              <p className="mt-1 text-2xl font-bold">
                {totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">{totalCapacity - totalSold} koltuk boş</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="size-4" />
                Toplam Gelir
              </div>
              <p className="mt-1 text-2xl font-bold">
                {totalRevenue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">tahmini (komisyon hariç)</p>
            </div>
          </div>

          {/* Bilet türü breakdown */}
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left">
                <tr>
                  <th className="p-3 font-medium">Bilet Türü</th>
                  <th className="p-3 font-medium">Kategori</th>
                  <th className="p-3 text-right font-medium">Fiyat</th>
                  <th className="p-3 text-right font-medium">Kapasite</th>
                  <th className="p-3 text-right font-medium">Satılan</th>
                  <th className="p-3 text-right font-medium">Doluluk</th>
                  <th className="p-3 text-right font-medium">Gelir</th>
                  <th className="p-3 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {ticketTypes.map((tt) => {
                  const fillRate = tt.capacity > 0 ? (tt.sold / tt.capacity) * 100 : 0;
                  const revenue = tt.sold * tt.price;
                  return (
                    <tr key={tt.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="p-3 font-medium">{tt.name}</td>
                      <td className="p-3 text-muted-foreground capitalize">
                        {tt.type === 'general' ? 'Genel' :
                         tt.type === 'vip' ? 'VIP' :
                         tt.type === 'student' ? 'Öğrenci' :
                         tt.type === 'early_bird' ? 'Erken Satış' :
                         tt.type}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {tt.price === 0 ? 'Ücretsiz' :
                          tt.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </td>
                      <td className="p-3 text-right">{tt.capacity.toLocaleString('tr-TR')}</td>
                      <td className="p-3 text-right font-medium">{tt.sold.toLocaleString('tr-TR')}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${fillRate >= 90 ? 'bg-destructive' : fillRate >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(fillRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs">{Math.round(fillRate)}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {revenue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            tt.status === 'active' ? 'success' :
                            tt.status === 'sold_out' ? 'destructive' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {tt.status === 'active' ? 'Aktif' :
                           tt.status === 'sold_out' ? 'Tükendi' :
                           tt.status === 'inactive' ? 'Pasif' :
                           tt.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ticketTypes.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Bu etkinliğe ait bilet türü tanımlanmamış.
        </div>
      )}

      {/* Etkinlik düzenle formu */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Etkinlik Bilgileri</h2>
        <EventEditorForm event={mock} />
      </div>
    </div>
  );
}
