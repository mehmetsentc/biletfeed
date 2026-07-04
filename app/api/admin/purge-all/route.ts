import { NextRequest, NextResponse } from 'next/server';
import {
  guardAdminAutomationOrMutation
} from '@/lib/auth/guard-admin-api';
import {
  getScrapedEventsSummary,
  purgeScrapedEvents
} from '@/lib/services/purge-scraped-events';
import { syncCityAndCategoryEventCounts } from '@/lib/services/event-counts';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/purge-all
 * Tüm harici (scraper) etkinlikleri kalıcı olarak siler.
 */
export async function POST(request: NextRequest) {
  const guard = await guardAdminAutomationOrMutation(request, 'events.scrape');
  if ('error' in guard) return guard.error;

  try {
    const before = await getScrapedEventsSummary();

    if (before.external === 0) {
      await syncCityAndCategoryEventCounts();
      const after = await getScrapedEventsSummary();
      return NextResponse.json({
        ok: true,
        deleted: 0,
        before,
        after,
        message: 'Silinecek harici etkinlik yok. Şehir/kategori sayıları güncellendi.'
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
