import { NextRequest, NextResponse } from 'next/server';
import { runEventScrapeJob } from '@/lib/scraper/sync';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/scrape-now
 * Admin panelinden manuel olarak scraper'ı çalıştırmak için.
 * ADMIN_SECRET env değişkeni ile korunur.
 */
export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: 'Sunucu yapılandırma hatası' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
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
