import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'
  );
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    };
  }

  bucket.count += 1;
  return { ok: true };
}

export function rateLimitOrNull(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const ip = getClientIp(request);
  const result = checkRateLimit(`${scope}:${ip}`, limit, windowMs);
  if (result.ok) return null;

  return NextResponse.json(
    { error: 'Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin.' },
    {
      status: 429,
      headers: { 'Retry-After': String(result.retryAfterSec) }
    }
  );
}

/** Upstash Redis varsa dağıtık rate limit; yoksa bellek içi fallback. */
export async function rateLimitOrNullAsync(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const key = `rl:${scope}:${ip}`;
  const redis = getRedisClient();
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSec);
      }
      if (count > limit) {
        const ttl = await redis.ttl(key);
        return NextResponse.json(
          { error: 'Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin.' },
          {
            status: 429,
            headers: { 'Retry-After': String(Math.max(1, ttl)) }
          }
        );
      }
      return null;
    } catch {
      // Redis hatasında bellek içi fallback
    }
  }

  return rateLimitOrNull(request, scope, limit, windowMs);
}
