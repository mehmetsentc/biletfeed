import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/security/cron-auth';
import { seedEventRulesCatalog } from '@/lib/seed/event-rules';

export const dynamic = 'force-dynamic';

/** Production — etkinlik kural kataloğunu günceller (deploy sonrası bir kez veya cron) */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await seedEventRulesCatalog();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
