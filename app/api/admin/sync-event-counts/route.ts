import { NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/permissions';
import { syncCityAndCategoryEventCounts } from '@/lib/services/event-counts';

export const dynamic = 'force-dynamic';

/** POST — şehir/kategori eventCount önbelleğini internal etkinliklere göre yeniler */
export async function POST() {
  const session = await verifySessionCookie();
  if (!session || !canAccessAdmin(session.role as never)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  }

  try {
    await syncCityAndCategoryEventCounts();
    return NextResponse.json({ ok: true, message: 'Şehir ve kategori sayıları güncellendi.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
