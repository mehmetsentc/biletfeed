import { BetaAnalyticsDataClient } from '@google-analytics/data';

export type Ga4DateRange = {
  startDate: string; // YYYY-MM-DD or '7daysAgo'
  endDate: string;
};

export type Ga4TrafficOverview = {
  pageviews: number;
  sessions: number;
  users: number;
  newUsers: number;
  avgSessionDurationSec: number;
  bounceRate: number;
};

export type Ga4NamedCount = { name: string; value: number };

function getCredentials(): object | null {
  const raw = process.env.GOOGLE_ANALYTICS_CREDENTIALS?.trim();
  if (!raw) return null;
  try {
    if (raw.startsWith('{')) return JSON.parse(raw) as object;
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(decoded) as object;
  } catch {
    return null;
  }
}

function getPropertyId(): string | null {
  const id = process.env.GA4_PROPERTY_ID?.trim();
  return id || null;
}

function clientOrNull(): BetaAnalyticsDataClient | null {
  const credentials = getCredentials();
  const propertyId = getPropertyId();
  if (!credentials || !propertyId) return null;
  return new BetaAnalyticsDataClient({ credentials });
}

function propertyName(): string | null {
  const id = getPropertyId();
  if (!id) return null;
  return id.startsWith('properties/') ? id : `properties/${id}`;
}

function metricValue(
  row: { metricValues?: Array<{ value?: string | null }> | null } | undefined,
  index: number
): number {
  const raw = row?.metricValues?.[index]?.value;
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function isGa4Configured(): boolean {
  return Boolean(getCredentials() && getPropertyId());
}

export async function getTrafficOverview(
  dateRange: Ga4DateRange
): Promise<Ga4TrafficOverview | null> {
  const client = clientOrNull();
  const property = propertyName();
  if (!client || !property) return null;

  try {
    const [response] = await client.runReport({
      property,
      dateRanges: [dateRange],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ]
    });
    const row = response.rows?.[0];
    return {
      pageviews: metricValue(row, 0),
      sessions: metricValue(row, 1),
      users: metricValue(row, 2),
      newUsers: metricValue(row, 3),
      avgSessionDurationSec: metricValue(row, 4),
      bounceRate: metricValue(row, 5)
    };
  } catch {
    return null;
  }
}

async function dimensionReport(
  dateRange: Ga4DateRange,
  dimension: string,
  metric = 'sessions',
  limit = 10
): Promise<Ga4NamedCount[] | null> {
  const client = clientOrNull();
  const property = propertyName();
  if (!client || !property) return null;

  try {
    const [response] = await client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: dimension }],
      metrics: [{ name: metric }],
      orderBys: [{ metric: { metricName: metric }, desc: true }],
      limit
    });
    return (response.rows ?? []).map((row) => ({
      name: row.dimensionValues?.[0]?.value || '(not set)',
      value: metricValue(row, 0)
    }));
  } catch {
    return null;
  }
}

async function channelFilteredSourceReport(
  dateRange: Ga4DateRange,
  channelGroup: string,
  limit = 10
): Promise<Ga4NamedCount[] | null> {
  const client = clientOrNull();
  const property = propertyName();
  if (!client || !property) return null;

  try {
    const [response] = await client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionDefaultChannelGroup',
          stringFilter: { value: channelGroup, matchType: 'EXACT' }
        }
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit
    });
    return (response.rows ?? []).map((row) => ({
      name: row.dimensionValues?.[0]?.value || '(not set)',
      value: metricValue(row, 0)
    }));
  } catch {
    return null;
  }
}

export async function getChannelBreakdown(
  dateRange: Ga4DateRange
): Promise<Ga4NamedCount[] | null> {
  return dimensionReport(dateRange, 'sessionDefaultChannelGroup');
}

export async function getSocialBreakdown(
  dateRange: Ga4DateRange
): Promise<Ga4NamedCount[] | null> {
  const social = await channelFilteredSourceReport(dateRange, 'Organic Social', 10);
  if (social && social.length > 0) return social;
  return dimensionReport(dateRange, 'sessionSource', 'sessions', 8);
}

export async function getSearchEngineBreakdown(
  dateRange: Ga4DateRange
): Promise<Ga4NamedCount[] | null> {
  return channelFilteredSourceReport(dateRange, 'Organic Search', 8);
}

export async function getReferralBreakdown(
  dateRange: Ga4DateRange
): Promise<Ga4NamedCount[] | null> {
  return channelFilteredSourceReport(dateRange, 'Referral', 12);
}

export async function getPaidCampaignBreakdown(
  dateRange: Ga4DateRange
): Promise<Ga4NamedCount[] | null> {
  const client = clientOrNull();
  const property = propertyName();
  if (!client || !property) return null;

  try {
    const [response] = await client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: 'sessionCampaignName' }],
      metrics: [{ name: 'sessions' }],
      dimensionFilter: {
        orGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'sessionDefaultChannelGroup',
                stringFilter: { value: 'Paid Search', matchType: 'EXACT' }
              }
            },
            {
              filter: {
                fieldName: 'sessionDefaultChannelGroup',
                stringFilter: { value: 'Paid Social', matchType: 'EXACT' }
              }
            },
            {
              filter: {
                fieldName: 'sessionDefaultChannelGroup',
                stringFilter: { value: 'Paid Other', matchType: 'EXACT' }
              }
            },
            {
              filter: {
                fieldName: 'sessionDefaultChannelGroup',
                stringFilter: { value: 'Display', matchType: 'EXACT' }
              }
            }
          ]
        }
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 12
    });
    return (response.rows ?? []).map((row) => ({
      name: row.dimensionValues?.[0]?.value || '(not set)',
      value: metricValue(row, 0)
    }));
  } catch {
    return dimensionReport(dateRange, 'sessionCampaignName', 'sessions', 10);
  }
}

export async function getDeviceBreakdown(
  dateRange: Ga4DateRange
): Promise<Ga4NamedCount[] | null> {
  return dimensionReport(dateRange, 'deviceCategory', 'sessions', 5);
}

export async function getOsBreakdown(
  dateRange: Ga4DateRange
): Promise<Ga4NamedCount[] | null> {
  return dimensionReport(dateRange, 'operatingSystem', 'sessions', 8);
}

export async function getBrowserBreakdown(
  dateRange: Ga4DateRange
): Promise<Ga4NamedCount[] | null> {
  return dimensionReport(dateRange, 'browser', 'sessions', 8);
}

export async function getCountryBreakdown(
  dateRange: Ga4DateRange
): Promise<Ga4NamedCount[] | null> {
  return dimensionReport(dateRange, 'country', 'totalUsers', 10);
}

export async function getGeoBreakdown(
  dateRange: Ga4DateRange
): Promise<Ga4NamedCount[] | null> {
  return dimensionReport(dateRange, 'city', 'totalUsers', 12);
}

export async function getLandingPages(
  dateRange: Ga4DateRange
): Promise<Ga4NamedCount[] | null> {
  return dimensionReport(dateRange, 'landingPage', 'sessions', 12);
}

export async function getTopPages(
  dateRange: Ga4DateRange
): Promise<Ga4NamedCount[] | null> {
  return dimensionReport(dateRange, 'pagePath', 'screenPageViews', 15);
}

export async function getRealtimeActiveUsers(): Promise<number | null> {
  const client = clientOrNull();
  const property = propertyName();
  if (!client || !property) return null;

  try {
    const [response] = await client.runRealtimeReport({
      property,
      metrics: [{ name: 'activeUsers' }]
    });
    return metricValue(response.rows?.[0], 0);
  } catch {
    return null;
  }
}

export async function getRealtimeTopPages(): Promise<Ga4NamedCount[] | null> {
  const client = clientOrNull();
  const property = propertyName();
  if (!client || !property) return null;

  try {
    const [response] = await client.runRealtimeReport({
      property,
      dimensions: [{ name: 'unifiedScreenName' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10
    });
    return (response.rows ?? []).map((row) => ({
      name: row.dimensionValues?.[0]?.value || '(not set)',
      value: metricValue(row, 0)
    }));
  } catch {
    try {
      const [response] = await client.runRealtimeReport({
        property,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10
      });
      return (response.rows ?? []).map((row) => ({
        name: row.dimensionValues?.[0]?.value || '(not set)',
        value: metricValue(row, 0)
      }));
    } catch {
      return null;
    }
  }
}
