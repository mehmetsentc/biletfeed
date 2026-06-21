import { NextRequest, NextResponse } from 'next/server';
import { runEventScrapeJob } from '@/lib/scraper/sync';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;

  return request.headers.get('x-cron-secret') === secret;
}

/** Her gün 21:00 TR (18:00 UTC) — Vercel Cron */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { runId, status, stats } = await runEventScrapeJob();

  return NextResponse.json({
    ok: status !== 'failed',
    runId,
    status,
    stats
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
