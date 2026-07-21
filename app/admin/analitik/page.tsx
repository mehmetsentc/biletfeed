import { getAdminAnalytics } from '@/lib/services/admin-dashboard';
import {
  getTrafficAnalyticsBundle,
  type AnalyticsRangeKey
} from '@/lib/services/site-analytics';
import { Users, CalendarDays, ShoppingCart, TrendingUp, Ticket, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsTabs } from '@/components/admin/analytics/analytics-tabs';
import { TrafficAnalyticsPanel } from '@/components/admin/analytics/traffic-analytics-panel';
import { getServerTranslations } from '@/lib/i18n/server';

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <Icon className={`size-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function parseRange(raw?: string): AnalyticsRangeKey {
  if (raw === 'today' || raw === '7d' || raw === '30d' || raw === '90d') return raw;
  return '7d';
}

interface PageProps {
  searchParams: Promise<{ tab?: string; range?: string }>;
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t } = await getServerTranslations();
  const tab = params.tab === 'traffic' ? 'traffic' : 'business';
  const rangeKey = parseRange(params.range);

  const [a, traffic] = await Promise.all([
    getAdminAnalytics(),
    tab === 'traffic'
      ? getTrafficAnalyticsBundle(rangeKey)
      : Promise.resolve(null)
  ]);

  const business = (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Toplam Kullanıcı"
          value={a.totalUsers.toLocaleString('tr-TR')}
          sub={`+${a.newUsers30d} son 30 günde`}
          icon={Users}
        />
        <StatCard
          label="Toplam Etkinlik"
          value={a.totalEvents.toLocaleString('tr-TR')}
          sub={`${a.activeEvents} aktif/yaklaşan`}
          icon={CalendarDays}
        />
        <StatCard
          label="Toplam Sipariş"
          value={a.totalOrders.toLocaleString('tr-TR')}
          sub={`${a.paidOrders} ödenmiş · %${a.conversionRate} dönüşüm`}
          icon={ShoppingCart}
        />
        <StatCard
          label="Toplam Gelir"
          value={`₺${a.revenueAll.toLocaleString('tr-TR')}`}
          sub="Tüm zamanlar"
          icon={TrendingUp}
          accent
        />
        <StatCard
          label="Son 30 Gün Geliri"
          value={`₺${a.revenue30d.toLocaleString('tr-TR')}`}
          sub={
            a.revenueGrowth !== null
              ? `${a.revenueGrowth >= 0 ? '+' : ''}${a.revenueGrowth}% önceki 30 güne göre`
              : undefined
          }
          icon={TrendingUp}
          accent
        />
        <StatCard
          label="Satılan Bilet"
          value={a.totalTickets.toLocaleString('tr-TR')}
          sub="Toplam verilen bilet"
          icon={Ticket}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-primary" /> Kategorilere Göre Etkinlik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {a.categoryStats.map((cat) => {
                const max = a.categoryStats[0]?.eventCount ?? 1;
                const pct = Math.round((cat.eventCount / max) * 100);
                return (
                  <div key={cat.slug}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{cat.name}</span>
                      <span className="font-semibold">{cat.eventCount}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-primary" /> Şehirlere Göre Etkinlik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {a.cityStats.map((city) => {
                const max = a.cityStats[0]?.eventCount ?? 1;
                const pct = Math.round((city.eventCount / max) * 100);
                return (
                  <div key={city.slug}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{city.name}</span>
                      <span className="font-semibold">{city.eventCount}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.admin.analyticsPage.title}</h1>
        <p className="text-muted-foreground">{t.admin.analyticsPage.subtitle}</p>
      </div>

      <AnalyticsTabs
        active={tab}
        business={business}
        traffic={
          traffic ? (
            <TrafficAnalyticsPanel data={traffic} rangeKey={rangeKey} />
          ) : (
            <p className="text-sm text-muted-foreground">…</p>
          )
        }
      />
    </div>
  );
}
