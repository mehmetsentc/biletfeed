import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/permissions';
import { ensureDbConnection } from '@/lib/db/prisma';
import { editPendingEventsWithAi } from '@/lib/scraper/ai/edit-events';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 dakika (Vercel Pro)

/**
 * POST /api/admin/ai-edit
 * Tüm pending harici etkinlikleri AI ile inceler:
 * kategori / şehir / açıklama düzeltir, onaylar veya reddeder.
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

  await ensureDbConnection();

  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const limit = Math.min(body.limit ?? 300, 500);

  const stats = await editPendingEventsWithAi(limit);

  return NextResponse.json({
    ok: true,
    ...stats,
    message: `${stats.processed} etkinlik işlendi: ${stats.approved} onaylandı, ${stats.rejected} reddedildi.`
  });
}
