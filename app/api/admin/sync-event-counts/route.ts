import { NextRequest, NextResponse } from 'next/server';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { syncCityAndCategoryEventCounts } from '@/lib/services/event-counts';

export const dynamic = 'force-dynamic';

/** POST — şehir/kategori eventCount önbelleğini internal etkinliklere göre yeniler */
export async function POST(request: NextRequest) {
  const guard = await guardAdminMutation(request, 'events.manage');
  if ('error' in guard) return guard.error;

  try {
    await syncCityAndCategoryEventCounts();
    return NextResponse.json({ ok: true, message: 'Şehir ve kategori sayıları güncellendi.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
