import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/permissions';
import {
  getScrapedEventsSummary,
  purgeScrapedEvents
} from '@/lib/services/purge-scraped-events';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/purge-all
 * Tüm harici (scraper) etkinlikleri kalıcı olarak siler.
 * Internal (organizatör) etkinliklere dokunmaz.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const session = await verifySessionCookie();
    if (!session || !canAccessAdmin(session.role as never)) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    }
  }

  try {
    const before = await getScrapedEventsSummary();

    if (before.external === 0) {
      return NextResponse.json({
        ok: true,
        deleted: 0,
        before,
        after: before,
        message: 'Silinecek harici etkinlik yok.'
      });
    }

    const result = await purgeScrapedEvents();
    const after = await getScrapedEventsSummary();

    return NextResponse.json({
      ok: true,
      deleted: result.deleted,
      breakdown: result.breakdown,
      feedPostsUnlinked: result.feedPostsUnlinked,
      ordersRemoved: result.ordersRemoved,
      before,
      after,
      message: `${result.deleted} harici etkinlik silindi. ${after.publishedInternal} onaylı internal etkinlik kaldı.`
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
