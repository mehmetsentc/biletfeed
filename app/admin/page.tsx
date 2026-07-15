import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminEventsSalesTable } from '@/components/admin/admin-events-sales-table';
import { getServerTranslations } from '@/lib/i18n/server';
import {
  getAdminEventsSalesOverview,
  getAdminStats
} from '@/lib/services/admin-dashboard';

export default async function AdminPage() {
  const { t } = await getServerTranslations();
  const [stats, eventSales] = await Promise.all([
    getAdminStats(),
    getAdminEventsSalesOverview()
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t.admin.title}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Toplam Kullanıcı', value: String(stats.users) },
          { label: 'Organizatör', value: String(stats.organizers) },
          { label: 'Yaklaşan Etkinlik', value: String(stats.activeEvents) },
          { label: 'Toplam Gelir', value: `₺${stats.revenue.toLocaleString('tr-TR')}` }
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {stats.orderCount} ödenmiş sipariş
      </p>
      <AdminEventsSalesTable rows={eventSales} />
    </div>
  );
}
