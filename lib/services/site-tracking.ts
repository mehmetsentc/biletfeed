import type {
  AnalyticsDeviceType,
  AnalyticsReferrerChannel,
  WebVitalName,
  WebVitalRating
} from '@prisma/client';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getRedisClient } from '@/lib/redis';
import { classifyReferrerChannel } from '@/lib/analytics/channel';

const ACTIVE_TTL_SEC = 5 * 60;
const ACTIVE_SET_KEY = 'analytics:active_sessions';
const ACTIVE_PATH_KEY = 'analytics:active_paths';

export type TrackPageViewInput = {
  path: string;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  userAgent?: string | null;
  deviceType: AnalyticsDeviceType;
  country?: string | null;
  city?: string | null;
  sessionId: string;
  userId?: string | null;
  scrollDepth?: number | null;
};

export async function trackPageView(input: TrackPageViewInput): Promise<void> {
  await ensureDbConnection();

  const path = input.path.slice(0, 500);
  const sessionId = input.sessionId.slice(0, 128);
  const channel = classifyReferrerChannel({
    referrer: input.referrer,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium
  });

  await prisma.pageView.create({
    data: {
      path,
      referrer: input.referrer?.slice(0, 1000) || null,
      utmSource: input.utmSource?.slice(0, 200) || null,
      utmMedium: input.utmMedium?.slice(0, 200) || null,
      utmCampaign: input.utmCampaign?.slice(0, 200) || null,
      userAgent: input.userAgent?.slice(0, 500) || null,
      deviceType: input.deviceType,
      country: input.country?.slice(0, 100) || null,
      city: input.city?.slice(0, 100) || null,
      sessionId,
      userId: input.userId || null
    }
  });

  const existing = await prisma.analyticsSession.findUnique({
    where: { sessionId }
  });

  if (!existing) {
    await prisma.analyticsSession.create({
      data: {
        sessionId,
        firstPath: path,
        referrerChannel: channel,
        utmSource: input.utmSource?.slice(0, 200) || null,
        utmMedium: input.utmMedium?.slice(0, 200) || null,
        utmCampaign: input.utmCampaign?.slice(0, 200) || null,
        deviceType: input.deviceType,
        country: input.country?.slice(0, 100) || null,
        city: input.city?.slice(0, 100) || null,
        pageViewCount: 1,
        userId: input.userId || null
      }
    });
  } else {
    await prisma.analyticsSession.update({
      where: { sessionId },
      data: {
        lastSeenAt: new Date(),
        pageViewCount: { increment: 1 },
        ...(input.userId && !existing.userId ? { userId: input.userId } : {})
      }
    });
  }

  await touchActiveSession(sessionId, path);
}

async function touchActiveSession(sessionId: string, path?: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    const key = `analytics:active:${sessionId}`;
    await redis.set(key, path || '1', { ex: ACTIVE_TTL_SEC });
    await redis.zadd(ACTIVE_SET_KEY, { score: Date.now(), member: sessionId });
    if (path) {
      await redis.hset(ACTIVE_PATH_KEY, { [sessionId]: path });
      await redis.expire(ACTIVE_PATH_KEY, ACTIVE_TTL_SEC * 2);
    }
    await redis.zremrangebyscore(ACTIVE_SET_KEY, 0, Date.now() - ACTIVE_TTL_SEC * 1000);
  } catch {
    // Redis optional
  }
}

export async function countActiveSessions(): Promise<number> {
  const redis = getRedisClient();
  if (!redis) return 0;
  try {
    await redis.zremrangebyscore(ACTIVE_SET_KEY, 0, Date.now() - ACTIVE_TTL_SEC * 1000);
    return await redis.zcard(ACTIVE_SET_KEY);
  } catch {
    return 0;
  }
}

export async function getActivePages(): Promise<Array<{ name: string; value: number }>> {
  const redis = getRedisClient();
  if (!redis) return [];
  try {
    await redis.zremrangebyscore(ACTIVE_SET_KEY, 0, Date.now() - ACTIVE_TTL_SEC * 1000);
    const members = await redis.zrange(ACTIVE_SET_KEY, 0, -1);
    if (!Array.isArray(members) || members.length === 0) return [];
    const counts = new Map<string, number>();
    for (const sid of members as string[]) {
      const p = await redis.hget<string>(ACTIVE_PATH_KEY, sid);
      if (!p) continue;
      counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  } catch {
    return [];
  }
}

export async function trackScrollDepth(input: {
  sessionId: string;
  path: string;
  depth: number;
}): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  const depth = Math.max(0, Math.min(100, Math.round(input.depth)));
  try {
    const key = `analytics:scroll:${input.sessionId}`;
    const prev = Number((await redis.get(key)) || 0);
    if (depth > prev) {
      await redis.set(key, String(depth), { ex: 60 * 60 * 6 });
    }
    // Aggregate bucket for averages in range window via sorted set of samples
    await redis.zadd('analytics:scroll_samples', {
      score: Date.now(),
      member: `${Date.now()}:${input.sessionId}:${depth}`
    });
    await redis.zremrangebyscore(
      'analytics:scroll_samples',
      0,
      Date.now() - 90 * 24 * 60 * 60 * 1000
    );
  } catch {
    /* optional */
  }
}

export async function averageScrollDepth(fromMs: number): Promise<number> {
  const redis = getRedisClient();
  if (!redis) return 0;
  try {
    const members = await redis.zrange('analytics:scroll_samples', fromMs, Date.now(), {
      byScore: true
    });
    if (!Array.isArray(members) || members.length === 0) return 0;
    let sum = 0;
    let n = 0;
    for (const m of members) {
      const parts = String(m).split(':');
      const depth = Number(parts[parts.length - 1]);
      if (Number.isFinite(depth)) {
        sum += depth;
        n += 1;
      }
    }
    return n > 0 ? sum / n : 0;
  } catch {
    return 0;
  }
}

export async function trackWebVital(input: {
  path: string;
  metric: WebVitalName;
  value: number;
  rating: WebVitalRating;
  sessionId?: string | null;
}): Promise<void> {
  await ensureDbConnection();
  await prisma.webVitalMetric.create({
    data: {
      path: input.path.slice(0, 500),
      metric: input.metric,
      value: input.value,
      rating: input.rating,
      sessionId: input.sessionId?.slice(0, 128) || null
    }
  });
}

export async function trackSiteSearch(input: {
  query: string;
  resultCount: number;
  userId?: string | null;
}): Promise<void> {
  await ensureDbConnection();
  const q = input.query.trim().slice(0, 200);
  if (!q) return;
  await prisma.siteSearchQuery.create({
    data: {
      query: q,
      resultCount: Math.max(0, input.resultCount),
      userId: input.userId || null
    }
  });
}

export async function trackNotFound(input: {
  path: string;
  referrer?: string | null;
}): Promise<void> {
  await ensureDbConnection();
  await prisma.notFoundLog.create({
    data: {
      path: input.path.slice(0, 500),
      referrer: input.referrer?.slice(0, 1000) || null
    }
  });
}

export type { AnalyticsReferrerChannel };
