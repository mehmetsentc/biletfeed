import type { NextRequest } from 'next/server';

/** Zamanlanmış cron — yalnızca CRON_SECRET Bearer */
export function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;

  // Vercel Cron uyumluluğu — production dışında header alternatifi
  if (process.env.NODE_ENV !== 'production') {
    return request.headers.get('x-cron-secret') === secret;
  }

  return false;
}
