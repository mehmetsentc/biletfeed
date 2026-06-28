import { NextRequest, NextResponse } from 'next/server';
import { sendNewsletterDigests } from '@/lib/services/newsletter-digest';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;

  return request.headers.get('x-cron-secret') === secret;
}

/** Scrape sonrası — konuma göre yeni etkinlik bülteni (22:00 TR / 19:00 UTC) */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sendNewsletterDigests();

  return NextResponse.json({
    ok: result.errors.length === 0,
    ...result,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
