import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/security/cron-auth';
import { recognizeDueRevenue } from '@/lib/accounting/revenue';

export const dynamic = 'force-dynamic';

/** Günlük — ertelenmiş gelirleri etkinlik tarihi geçenler için tanır */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const recognized = await recognizeDueRevenue();
  return NextResponse.json({ ok: true, recognized });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
