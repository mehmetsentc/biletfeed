import type { AnalyticsReferrerChannel, AnalyticsDeviceType } from '@prisma/client';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import {
  averageScrollDepth,
  countActiveSessions,
  getActivePages
} from '@/lib/services/site-tracking';
import {
  getBrowserBreakdown,
  getChannelBreakdown,
  getCountryBreakdown,
  getDeviceBreakdown,
  getGeoBreakdown,
  getLandingPages,
  getOsBreakdown,
  getPaidCampaignBreakdown,
  getRealtimeActiveUsers,
  getRealtimeTopPages,
  getReferralBreakdown,
  getSearchEngineBreakdown,
  getSocialBreakdown,
  getTopPages as getGa4TopPages,
  getTrafficOverview,
  isGa4Configured,
  type Ga4DateRange,
  type Ga4NamedCount,
  type Ga4TrafficOverview
} from '@/lib/services/ga4-analytics';

// TODO: yüksek trafikte DailyTrafficStat (date, pageviews, sessions, uniqueUsers)
// rollup tablosu + gece cron (app/api/cron/) eklenebilir; v1 doğrudan aggregate.

export type AnalyticsRangeKey = 'today' | '7d' | '30d' | '90d';

export function resolveAnalyticsRange(key: AnalyticsRangeKey): {
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
  ga4: Ga4DateRange;
  ga4Prev: Ga4DateRange;
  days: number;
} {
  const to = new Date();
  const from = new Date(to);
  let days = 1;
  if (key === 'today') {
    from.setHours(0, 0, 0, 0);
    days = 1;
  } else {
    days = key === '7d' ? 7 : key === '30d' ? 30 : 90;
    from.setDate(from.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);
  }

  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - (days - 1));
  prevFrom.setHours(0, 0, 0, 0);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return {
    from,
    to,
    prevFrom,
    prevTo,
    days,
    ga4: {
      startDate:
        key === 'today'
          ? 'today'
          : key === '7d'
            ? '7daysAgo'
            : key === '30d'
              ? '30daysAgo'
              : '90daysAgo',
      endDate: 'today'
    },
    ga4Prev: {
      startDate: fmt(prevFrom),
      endDate: fmt(prevTo)
    }
  };
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export type SiteTrafficKpis = {
  pageviews: number;
  uniqueSessions: number;
  avgPagesPerSession: number;
  bounceRate: number;
  activeNow: number;
  avgScrollDepth: number;
  newUsers: number;
  returningSessions: number;
  pageviewsChange: number | null;
  sessionsChange: number | null;
  bounceChange: number | null;
};

export type DailyTrafficPoint = { date: string; pageviews: number; sessions: number };

export type NamedCount = { name: string; value: number };

export type WebVitalSummary = {
  metric: 'LCP' | 'INP' | 'CLS' | 'TTFB';
  avg: number;
  rating: 'good' | 'needs_improvement' | 'poor';
  samples: number;
};

export type FunnelStats = {
  eventViews: number;
  ticketSelects: number;
  checkoutStarts: number;
  pendingOrders: number;
  paidOrders: number;
  conversionRate: number;
  dropOffViewToSelect: number;
  dropOffSelectToCheckout: number;
  dropOffCheckoutToPaid: number;
  cartAbandonmentRate: number;
  aov: number;
};

export type TrafficAnalyticsBundle = {
  rangeKey: AnalyticsRangeKey;
  kpis: SiteTrafficKpis;
  daily: DailyTrafficPoint[];
  topPages: NamedCount[];
  topContent: NamedCount[];
  topSellingEvents: NamedCount[];
  landingPages: NamedCount[];
  exitPages: NamedCount[];
  devices: NamedCount[];
  channels: NamedCount[];
  webVitals: WebVitalSummary[];
  funnel: FunnelStats;
  searches: NamedCount[];
  zeroSearches: NamedCount[];
  notFound: NamedCount[];
  activePages: NamedCount[];
  ga4Configured: boolean;
  ga4Overview: Ga4TrafficOverview | null;
  ga4Channels: Ga4NamedCount[] | null;
  ga4Social: Ga4NamedCount[] | null;
  ga4Search: Ga4NamedCount[] | null;
  ga4Referral: Ga4NamedCount[] | null;
  ga4Paid: Ga4NamedCount[] | null;
  ga4Devices: Ga4NamedCount[] | null;
  ga4Os: Ga4NamedCount[] | null;
  ga4Browsers: Ga4NamedCount[] | null;
  ga4Countries: Ga4NamedCount[] | null;
  ga4Geo: Ga4NamedCount[] | null;
  ga4TopPages: Ga4NamedCount[] | null;
  ga4Landing: Ga4NamedCount[] | null;
  ga4Realtime: number | null;
  ga4RealtimePages: Ga4NamedCount[] | null;
};

function rateWebVital(metric: WebVitalSummary['metric'], avg: number): WebVitalSummary['rating'] {
  if (metric === 'LCP') {
    if (avg <= 2500) return 'good';
    if (avg <= 4000) return 'needs_improvement';
    return 'poor';
  }
  if (metric === 'INP') {
    if (avg <= 200) return 'good';
    if (avg <= 500) return 'needs_improvement';
    return 'poor';
  }
  if (metric === 'CLS') {
    if (avg <= 0.1) return 'good';
    if (avg <= 0.25) return 'needs_improvement';
    return 'poor';
  }
  if (avg <= 800) return 'good';
  if (avg <= 1800) return 'needs_improvement';
  return 'poor';
}

async function countPageviews(from: Date, to: Date): Promise<number> {
  return prisma.pageView.count({ where: { createdAt: { gte: from, lte: to } } });
}

async function sessionStats(from: Date, to: Date) {
  const sessions = await prisma.analyticsSession.findMany({
    where: { startedAt: { gte: from, lte: to } },
    select: { pageViewCount: true, userId: true }
  });
  const bounced = sessions.filter((s) => s.pageViewCount === 1).length;
  const withUser = sessions.filter((s) => s.userId).length;
  return {
    uniqueSessions: sessions.length,
    bounced,
    totalPages: sessions.reduce((s, x) => s + x.pageViewCount, 0),
    returningSessions: withUser
  };
}

export async function getTrafficAnalyticsBundle(
  rangeKey: AnalyticsRangeKey = '7d'
): Promise<TrafficAnalyticsBundle> {
  await ensureDbConnection();
  const { from, to, prevFrom, prevTo, ga4, ga4Prev } = resolveAnalyticsRange(rangeKey);

  const [
    pageviews,
    prevPageviews,
    currentSessions,
    prevSessions,
    dailyRaw,
    topPagesRaw,
    devicesRaw,
    channelsRaw,
    vitalsRaw,
    eventViews,
    ticketSelects,
    checkoutStarts,
    pendingOrders,
    paidOrders,
    paidAgg,
    searchesRaw,
    zeroSearchesRaw,
    notFoundRaw,
    feedTop,
    landingRaw,
    exitRaw,
    topSalesRaw,
    activeNow,
    activePagesFp,
    avgScroll,
    ga4Overview,
    ga4OverviewPrev,
    ga4Channels,
    ga4Social,
    ga4Search,
    ga4Referral,
    ga4Paid,
    ga4Devices,
    ga4Os,
    ga4Browsers,
    ga4Countries,
    ga4Geo,
    ga4TopPages,
    ga4Landing,
    ga4Realtime,
    ga4RealtimePages
  ] = await Promise.all([
    countPageviews(from, to),
    countPageviews(prevFrom, prevTo),
    sessionStats(from, to),
    sessionStats(prevFrom, prevTo),
    (async () => {
      try {
        return await prisma.$queryRaw<
          Array<{ day: Date; pageviews: bigint; sessions: bigint }>
        >`
          SELECT date_trunc('day', created_at) AS day,
                 COUNT(*)::bigint AS pageviews,
                 COUNT(DISTINCT session_id)::bigint AS sessions
          FROM page_views
          WHERE created_at >= ${from} AND created_at <= ${to}
          GROUP BY 1
          ORDER BY 1 ASC
        `;
      } catch {
        return [] as Array<{ day: Date; pageviews: bigint; sessions: bigint }>;
      }
    })(),
    prisma.pageView.groupBy({
      by: ['path'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
      orderBy: { _count: { path: 'desc' } },
      take: 15
    }),
    prisma.pageView.groupBy({
      by: ['deviceType'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
      orderBy: { _count: { deviceType: 'desc' } }
    }),
    prisma.analyticsSession.groupBy({
      by: ['referrerChannel'],
      where: { startedAt: { gte: from, lte: to } },
      _count: { _all: true },
      orderBy: { _count: { referrerChannel: 'desc' } }
    }),
    prisma.webVitalMetric.groupBy({
      by: ['metric'],
      where: { createdAt: { gte: from, lte: to } },
      _avg: { value: true },
      _count: { _all: true }
    }),
    prisma.pageView.count({
      where: { createdAt: { gte: from, lte: to }, path: { startsWith: '/etkinlik/' } }
    }),
    prisma.pageView.count({
      where: {
        createdAt: { gte: from, lte: to },
        path: { contains: '/bilet' }
      }
    }),
    prisma.pageView.count({
      where: {
        createdAt: { gte: from, lte: to },
        path: { contains: '/odeme' }
      }
    }),
    prisma.order.count({
      where: {
        status: 'pending',
        deletedAt: null,
        createdAt: { gte: from, lte: to }
      }
    }),
    prisma.order.count({
      where: {
        status: 'paid',
        deletedAt: null,
        paymentProvider: { not: 'invitation' },
        createdAt: { gte: from, lte: to }
      }
    }),
    prisma.order.aggregate({
      where: {
        status: 'paid',
        deletedAt: null,
        paymentProvider: { not: 'invitation' },
        createdAt: { gte: from, lte: to }
      },
      _avg: { total: true },
      _sum: { total: true }
    }),
    prisma.siteSearchQuery.groupBy({
      by: ['query'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10
    }),
    prisma.siteSearchQuery.groupBy({
      by: ['query'],
      where: { createdAt: { gte: from, lte: to }, resultCount: 0 },
      _count: { _all: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10
    }),
    prisma.notFoundLog.groupBy({
      by: ['path'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10
    }),
    prisma.feedPost
      .findMany({
        where: { status: 'published', deletedAt: null },
        select: { title: true, viewCount: true },
        orderBy: { viewCount: 'desc' },
        take: 10
      })
      .catch(() => [] as Array<{ title: string; viewCount: number }>),
    prisma.analyticsSession.groupBy({
      by: ['firstPath'],
      where: { startedAt: { gte: from, lte: to } },
      _count: { _all: true },
      orderBy: { _count: { firstPath: 'desc' } },
      take: 10
    }),
    (async () => {
      try {
        return await prisma.$queryRaw<Array<{ path: string; cnt: bigint }>>`
          SELECT path, COUNT(*)::bigint AS cnt
          FROM (
            SELECT DISTINCT ON (session_id) path
            FROM page_views
            WHERE created_at >= ${from} AND created_at <= ${to}
            ORDER BY session_id, created_at DESC
          ) last_hits
          GROUP BY path
          ORDER BY cnt DESC
          LIMIT 10
        `;
      } catch {
        return [] as Array<{ path: string; cnt: bigint }>;
      }
    })(),
    prisma.order.findMany({
      where: {
        status: 'paid',
        deletedAt: null,
        paymentProvider: { not: 'invitation' },
        createdAt: { gte: from, lte: to },
        event: { deletedAt: null }
      },
      select: {
        total: true,
        event: { select: { title: true } },
        items: { select: { quantity: true } }
      },
      take: 5000
    }),
    countActiveSessions(),
    getActivePages(),
    averageScrollDepth(from.getTime()),
    getTrafficOverview(ga4),
    getTrafficOverview(ga4Prev),
    getChannelBreakdown(ga4),
    getSocialBreakdown(ga4),
    getSearchEngineBreakdown(ga4),
    getReferralBreakdown(ga4),
    getPaidCampaignBreakdown(ga4),
    getDeviceBreakdown(ga4),
    getOsBreakdown(ga4),
    getBrowserBreakdown(ga4),
    getCountryBreakdown(ga4),
    getGeoBreakdown(ga4),
    getGa4TopPages(ga4),
    getLandingPages(ga4),
    getRealtimeActiveUsers(),
    getRealtimeTopPages()
  ]);

  const uniqueSessions = currentSessions.uniqueSessions;
  const bounceRate =
    uniqueSessions > 0 ? currentSessions.bounced / uniqueSessions : 0;
  const prevBounce =
    prevSessions.uniqueSessions > 0
      ? prevSessions.bounced / prevSessions.uniqueSessions
      : 0;

  const channelLabels: Record<AnalyticsReferrerChannel, string> = {
    organic: 'Organik',
    direct: 'Doğrudan',
    social: 'Sosyal',
    paid: 'Ücretli',
    referral: 'Yönlendirme',
    email: 'E-posta',
    app: 'Uygulama'
  };

  const deviceLabels: Record<AnalyticsDeviceType, string> = {
    mobile: 'Mobil',
    desktop: 'Masaüstü',
    tablet: 'Tablet',
    unknown: 'Bilinmiyor'
  };

  const salesMap = new Map<string, number>();
  for (const o of topSalesRaw) {
    const title = o.event?.title || 'Etkinlik';
    const tickets = o.items.reduce((s, i) => s + i.quantity, 0);
    salesMap.set(title, (salesMap.get(title) ?? 0) + tickets);
  }
  const topSellingEvents = [...salesMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const checkoutDenom = Math.max(pendingOrders + paidOrders, 1);
  const funnel: FunnelStats = {
    eventViews,
    ticketSelects,
    checkoutStarts,
    pendingOrders,
    paidOrders,
    conversionRate: eventViews > 0 ? paidOrders / eventViews : 0,
    dropOffViewToSelect: eventViews > 0 ? 1 - ticketSelects / eventViews : 0,
    dropOffSelectToCheckout:
      ticketSelects > 0 ? 1 - checkoutStarts / ticketSelects : 0,
    dropOffCheckoutToPaid:
      checkoutDenom > 0 ? 1 - paidOrders / checkoutDenom : 0,
    cartAbandonmentRate:
      pendingOrders + paidOrders > 0
        ? pendingOrders / (pendingOrders + paidOrders)
        : 0,
    aov: paidAgg._avg.total ?? 0
  };

  const overviewPageviews = ga4Overview?.pageviews ?? pageviews;
  const overviewPrevPv = ga4OverviewPrev?.pageviews ?? prevPageviews;
  const overviewSessions = ga4Overview?.sessions ?? uniqueSessions;
  const overviewPrevSessions = ga4OverviewPrev?.sessions ?? prevSessions.uniqueSessions;
  const overviewBounce = ga4Overview?.bounceRate ?? bounceRate;
  const overviewPrevBounce = ga4OverviewPrev?.bounceRate ?? prevBounce;

  return {
    rangeKey,
    kpis: {
      pageviews: overviewPageviews,
      uniqueSessions: overviewSessions,
      avgPagesPerSession:
        uniqueSessions > 0 ? currentSessions.totalPages / uniqueSessions : 0,
      bounceRate: overviewBounce > 1 ? overviewBounce / 100 : overviewBounce,
      activeNow: activeNow || ga4Realtime || 0,
      avgScrollDepth: avgScroll,
      newUsers: ga4Overview?.newUsers ?? 0,
      returningSessions: currentSessions.returningSessions,
      pageviewsChange: pctChange(overviewPageviews, overviewPrevPv),
      sessionsChange: pctChange(overviewSessions, overviewPrevSessions),
      bounceChange: pctChange(
        overviewBounce > 1 ? overviewBounce : overviewBounce * 100,
        overviewPrevBounce > 1 ? overviewPrevBounce : overviewPrevBounce * 100
      )
    },
    daily: dailyRaw.map((r) => ({
      date: new Date(r.day).toISOString().slice(0, 10),
      pageviews: Number(r.pageviews),
      sessions: Number(r.sessions)
    })),
    topPages: topPagesRaw.map((r) => ({ name: r.path, value: r._count._all })),
    topContent: feedTop.map((f) => ({ name: f.title, value: f.viewCount })),
    topSellingEvents,
    landingPages: landingRaw.map((r) => ({
      name: r.firstPath,
      value: r._count._all
    })),
    exitPages: exitRaw.map((r) => ({ name: r.path, value: Number(r.cnt) })),
    devices: devicesRaw.map((r) => ({
      name: deviceLabels[r.deviceType] ?? r.deviceType,
      value: r._count._all
    })),
    channels: channelsRaw.map((r) => ({
      name: channelLabels[r.referrerChannel] ?? r.referrerChannel,
      value: r._count._all
    })),
    webVitals: vitalsRaw.map((v) => {
      const metric = v.metric as WebVitalSummary['metric'];
      const avg = v._avg.value ?? 0;
      return {
        metric,
        avg,
        rating: rateWebVital(metric, avg),
        samples: v._count._all
      };
    }),
    funnel,
    searches: searchesRaw.map((r) => ({ name: r.query, value: r._count._all })),
    zeroSearches: zeroSearchesRaw.map((r) => ({
      name: r.query,
      value: r._count._all
    })),
    notFound: notFoundRaw.map((r) => ({ name: r.path, value: r._count._all })),
    activePages: activePagesFp.length
      ? activePagesFp
      : (ga4RealtimePages ?? []).map((r) => ({ name: r.name, value: r.value })),
    ga4Configured: isGa4Configured(),
    ga4Overview,
    ga4Channels,
    ga4Social,
    ga4Search,
    ga4Referral,
    ga4Paid,
    ga4Devices,
    ga4Os,
    ga4Browsers,
    ga4Countries,
    ga4Geo,
    ga4TopPages,
    ga4Landing,
    ga4Realtime,
    ga4RealtimePages
  };
}
