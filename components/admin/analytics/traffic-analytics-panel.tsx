'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Activity,
  Download,
  Eye,
  Gauge,
  Globe2,
  MonitorSmartphone,
  Search,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminHref } from '@/lib/config/domain';
import type { TrafficAnalyticsBundle, AnalyticsRangeKey } from '@/lib/services/site-analytics';
import { useTranslations } from '@/components/providers';

const RANGE_KEYS: AnalyticsRangeKey[] = ['today', '7d', '30d', '90d'];

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '—';
  if (sec < 60) return `${Math.round(sec)} sn`;
  return `${Math.floor(sec / 60)} dk ${Math.round(sec % 60)} sn`;
}

function vitalColor(rating: string): string {
  if (rating === 'good') return 'text-emerald-600';
  if (rating === 'needs_improvement') return 'text-amber-600';
  return 'text-rose-600';
}

function ChangeBadge({ value }: { value: number | null }) {
  if (value == null) return null;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`mt-1 inline-flex items-center gap-0.5 text-xs font-medium ${
        up ? 'text-emerald-600' : 'text-rose-600'
      }`}
    >
      <Icon className="size-3" />
      {up ? '+' : ''}
      {value}%
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}

function RankTable({
  rows,
  empty
}: {
  rows: Array<{ name: string; value: number }>;
  empty: string;
}) {
  if (rows.length === 0) return <Empty text={empty} />;
  const max = rows[0]?.value || 1;
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.name}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate font-medium" title={row.name}>
              {row.name}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {row.value.toLocaleString('tr-TR')}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${Math.max(4, Math.round((row.value / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function exportCsv(data: TrafficAnalyticsBundle) {
  const lines: string[] = ['section,name,value'];
  const push = (section: string, rows: Array<{ name: string; value: number }>) => {
    for (const r of rows) {
      lines.push(
        `${JSON.stringify(section)},${JSON.stringify(r.name)},${r.value}`
      );
    }
  };
  lines.push(`kpi,pageviews,${data.kpis.pageviews}`);
  lines.push(`kpi,sessions,${data.kpis.uniqueSessions}`);
  lines.push(`kpi,bounceRate,${data.kpis.bounceRate}`);
  lines.push(`kpi,aov,${data.funnel.aov}`);
  lines.push(`kpi,paidOrders,${data.funnel.paidOrders}`);
  push('channels', data.ga4Channels ?? data.channels);
  push('topPages', data.ga4TopPages ?? data.topPages);
  push('landing', data.ga4Landing ?? data.landingPages);
  push('exit', data.exitPages);
  push('searches', data.searches);
  push('notFound', data.notFound);
  push('topSelling', data.topSellingEvents);
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `biletfeed-trafik-${data.rangeKey}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TrafficAnalyticsPanel({
  data,
  rangeKey
}: {
  data: TrafficAnalyticsBundle;
  rangeKey: AnalyticsRangeKey;
}) {
  const t = useTranslations();
  const ap = t.admin.analyticsPage;

  const channels = useMemo(
    () => data.ga4Channels ?? data.channels,
    [data.ga4Channels, data.channels]
  );
  const devices = useMemo(
    () => data.ga4Devices ?? data.devices,
    [data.ga4Devices, data.devices]
  );
  const topPages = useMemo(
    () => data.ga4TopPages ?? data.topPages,
    [data.ga4TopPages, data.topPages]
  );
  const landing = useMemo(
    () => data.ga4Landing ?? data.landingPages,
    [data.ga4Landing, data.landingPages]
  );

  const rangeLabels: Record<AnalyticsRangeKey, string> = {
    today: ap.rangeToday,
    '7d': ap.range7d,
    '30d': ap.range30d,
    '90d': ap.range90d
  };

  const bounce = data.kpis.bounceRate;
  const avgDur = data.ga4Overview?.avgSessionDurationSec;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {RANGE_KEYS.map((key) => (
          <Button
            key={key}
            asChild
            size="sm"
            variant={rangeKey === key ? 'default' : 'outline'}
          >
            <Link href={adminHref(`/analitik?tab=traffic&range=${key}`)}>
              {rangeLabels[key]}
            </Link>
          </Button>
        ))}
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={() => exportCsv(data)}
        >
          <Download className="mr-1.5 size-3.5" />
          CSV
        </Button>
      </div>

      {!data.ga4Configured && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4 text-sm text-muted-foreground">
            {ap.ga4Missing}{' '}
            <span className="text-xs">(docs/GA4_ADMIN_ANALYTICS.md)</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[
          {
            label: ap.pageviews,
            value: data.kpis.pageviews.toLocaleString('tr-TR'),
            change: data.kpis.pageviewsChange,
            icon: Eye
          },
          {
            label: ap.uniqueVisitors,
            value: (data.ga4Overview?.users ?? data.kpis.uniqueSessions).toLocaleString(
              'tr-TR'
            ),
            change: data.kpis.sessionsChange,
            icon: Users
          },
          {
            label: ap.sessions,
            value: data.kpis.uniqueSessions.toLocaleString('tr-TR'),
            change: data.kpis.sessionsChange,
            icon: Activity
          },
          {
            label: 'Yeni kullanıcı',
            value: data.kpis.newUsers.toLocaleString('tr-TR'),
            change: null,
            icon: Users
          },
          {
            label: ap.avgSession,
            value:
              avgDur != null
                ? formatDuration(avgDur)
                : `${data.kpis.avgPagesPerSession.toFixed(1)} syf`,
            change: null,
            icon: Gauge
          },
          {
            label: ap.bounceRate,
            value: pct(bounce > 1 ? bounce / 100 : bounce),
            change: data.kpis.bounceChange,
            icon: MonitorSmartphone
          },
          {
            label: 'Ort. kaydırma',
            value: `${Math.round(data.kpis.avgScrollDepth)}%`,
            change: null,
            icon: Gauge
          },
          {
            label: ap.activeNow,
            value: String(data.kpis.activeNow),
            change: null,
            icon: Globe2
          }
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold tabular-nums">{kpi.value}</p>
              <ChangeBadge value={kpi.change} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ap.dailyTraffic}</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {data.daily.length === 0 ? (
            <Empty text="Henüz günlük trafik verisi yok." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="pageviews"
                  name="Görüntülenme"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  name="Oturum"
                  stroke="#38bdf8"
                  fill="#38bdf8"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ap.trafficSources}</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            {channels.length === 0 ? (
              <Empty text="Kaynak verisi yok." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channels}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Oturum" fill="hsl(var(--primary))" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Şu an aktif sayfalar</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={data.activePages} empty="Aktif sayfa yok." />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ap.socialSources}</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={data.ga4Social ?? []} empty="GA4 sosyal verisi yok." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organik arama</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={data.ga4Search ?? []} empty="GA4 arama verisi yok." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yönlendirme</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={data.ga4Referral ?? []} empty="GA4 referral yok." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ücretli kampanya</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={data.ga4Paid ?? []} empty="GA4 kampanya yok." />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ap.topPages}</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={topPages} empty="Henüz sayfa görüntülenmesi yok." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ap.topContent}</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={data.topContent} empty="Feed görüntülenmesi yok." />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Giriş sayfaları</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={landing} empty="Landing verisi yok." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Çıkış sayfaları</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={data.exitPages} empty="Exit verisi yok." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">En çok satan etkinlikler</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={data.topSellingEvents} empty="Satış yok." />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ap.devices}</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={devices} empty="Cihaz verisi yok." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">İşletim sistemi</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={data.ga4Os ?? []} empty="OS için GA4 gerekir." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tarayıcı</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={data.ga4Browsers ?? []} empty="Tarayıcı için GA4 gerekir." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ap.geo}</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={data.ga4Geo ?? []} empty="Konum için GA4 gerekir." />
            {data.ga4Countries && data.ga4Countries.length > 0 && (
              <>
                <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">Ülke</p>
                <RankTable rows={data.ga4Countries} empty="" />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ap.webVitals}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.webVitals.length === 0 ? (
            <Empty text="Web vitals henüz toplanmadı (consent + gerçek ziyaret gerekir)." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.webVitals.map((v) => (
                <div
                  key={v.metric}
                  className="rounded-xl border border-border bg-muted/30 p-4"
                >
                  <p className="text-xs font-medium text-muted-foreground">{v.metric}</p>
                  <p className={`mt-1 text-2xl font-bold tabular-nums ${vitalColor(v.rating)}`}>
                    {v.metric === 'CLS' ? v.avg.toFixed(3) : `${Math.round(v.avg)}`}
                    {v.metric !== 'CLS' && (
                      <span className="text-sm font-normal text-muted-foreground"> ms</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {v.rating.replace('_', ' ')} · {v.samples} örnek
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ap.funnel}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Etkinlik görüntüleme', value: data.funnel.eventViews },
              { label: 'Bilet / ödeme adımı', value: data.funnel.ticketSelects },
              { label: 'Bekleyen sipariş', value: data.funnel.pendingOrders },
              { label: 'Ödenen sipariş', value: data.funnel.paidOrders }
            ].map((step) => (
              <div key={step.label} className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">{step.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {step.value.toLocaleString('tr-TR')}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">Dönüşüm</p>
              <p className="mt-1 text-xl font-bold">{pct(data.funnel.conversionRate)}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">Sepet terk</p>
              <p className="mt-1 text-xl font-bold">
                {pct(data.funnel.cartAbandonmentRate)}
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">AOV</p>
              <p className="mt-1 text-xl font-bold">
                ₺{Math.round(data.funnel.aov).toLocaleString('tr-TR')}
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">Drop-off (görüntüle→seç)</p>
              <p className="mt-1 text-xl font-bold">
                {pct(data.funnel.dropOffViewToSelect)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="size-4 text-primary" /> {ap.siteSearch}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs font-medium text-muted-foreground">En çok aranan</p>
            <RankTable rows={data.searches} empty="Arama kaydı yok." />
            <p className="mb-3 mt-6 text-xs font-medium text-muted-foreground">
              Sonuç bulunamayan
            </p>
            <RankTable rows={data.zeroSearches} empty="Sıfır sonuçlu arama yok." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="size-4 text-primary" /> {ap.notFound}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable rows={data.notFound} empty="404 kaydı yok." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
