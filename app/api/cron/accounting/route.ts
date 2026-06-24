import { NextRequest, NextResponse } from 'next/server';
import { recognizeDueRevenue } from '@/lib/accounting/revenue';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;
  return request.headers.get('x-cron-secret') === secret;
}

/** Günlük — ertelenmiş gelirleri etkinlik tarihi geçenler için tanır */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const recognized = await recognizeDueRevenue();
  return NextResponse.json({ ok: true, recognized });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
