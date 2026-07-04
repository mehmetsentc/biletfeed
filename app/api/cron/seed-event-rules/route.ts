import { NextRequest, NextResponse } from 'next/server';
import { seedEventRulesCatalog } from '@/lib/seed/event-rules';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;
  return request.headers.get('x-cron-secret') === secret;
}

/** Production — etkinlik kural kataloğunu günceller (deploy sonrası bir kez veya cron) */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await seedEventRulesCatalog();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
