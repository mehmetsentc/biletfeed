import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/security/cron-auth';
import { runEditorialPipeline } from '@/lib/services/feed-editorial';

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const batch = Number(request.nextUrl.searchParams.get('batch') ?? '5');
  // ?external=1 ile harici keşif (Tavily + RSS) aktifleşir
  const includeExternal = request.nextUrl.searchParams.get('external') !== '0';

  const result = await runEditorialPipeline(batch, includeExternal);
  return NextResponse.json({ success: true, ...result });
}
