import Link from 'next/link';
import { formatEventDate } from '@/lib/data/mock-events';
import type { AdminEventSalesRow } from '@/lib/services/admin-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function formatMoney(amount: number): string {
  return `₺${amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
}

export function AdminEventsSalesTable({ rows }: { rows: AdminEventSalesRow[] }) {
  const totalTickets = rows.reduce((sum, row) => sum + row.ticketsSold, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-lg">Satışa Açık Etkinlikler</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Yayında olan platform etkinlikleri — bilet adedi ve ciro
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/etkinlik-onay">Onay bekleyenler</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Etkinlik</th>
                <th className="p-3 font-medium">Tarih</th>
                <th className="p-3 font-medium">Organizatör</th>
                <th className="p-3 font-medium">Şehir</th>
                <th className="p-3 text-right font-medium">Satılan Bilet</th>
                <th className="p-3 text-right font-medium">Ciro</th>
                <th className="p-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3 font-medium">{row.title}</td>
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {formatEventDate(row.startDate.toISOString())}
                  </td>
                  <td className="p-3 text-muted-foreground">{row.organizerName}</td>
                  <td className="p-3 text-muted-foreground">{row.cityName}</td>
                  <td className="p-3 text-right font-semibold tabular-nums">
                    {row.ticketsSold.toLocaleString('tr-TR')}
                  </td>
                  <td className="p-3 text-right font-semibold tabular-nums">
                    {formatMoney(row.revenue)}
                  </td>
                  <td className="p-3">
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/admin/etkinlikler/${row.id}`}>Detay</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Satışa açık yayınlanmış etkinlik yok.
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="border-t bg-muted/30 text-left font-semibold">
                <tr>
                  <td className="p-3" colSpan={4}>
                    Toplam ({rows.length} etkinlik)
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {totalTickets.toLocaleString('tr-TR')}
                  </td>
                  <td className="p-3 text-right tabular-nums">{formatMoney(totalRevenue)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
