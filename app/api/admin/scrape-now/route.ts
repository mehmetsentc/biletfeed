import { NextRequest, NextResponse } from 'next/server';
import { runEventScrapeJob } from '@/lib/scraper/sync';
import { verifySessionCookie } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/permissions';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/scrape-now
 * Admin session cookie veya ADMIN_SECRET/CRON_SECRET Bearer token ile korunur.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  const isCron = adminSecret && authHeader === `Bearer ${adminSecret}`;

  if (!isCron) {
    const session = await verifySessionCookie();
    if (!session || !canAccessAdmin(session.role as never)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
  }

  try {
    const { runId, status, stats } = await runEventScrapeJob();
    return NextResponse.json({ ok: status !== 'failed', runId, status, stats });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
