import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/security/cron-auth';
import { expireStalePendingOrders } from '@/lib/services/orders';

export const dynamic = 'force-dynamic';

/** Süresi dolmuş pending siparişleri iptal et */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expired = await expireStalePendingOrders();
  return NextResponse.json({ ok: true, expired });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
