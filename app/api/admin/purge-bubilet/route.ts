import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/permissions';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/purge-bubilet
 * Veritabanındaki tüm BUBILET kaynaklı etkinlikleri hard-delete eder.
 * Yanlış şehir atamaları düzeltildikten sonra temiz re-scrape için kullanılır.
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

  try {
    const count = await prisma.event.count({
      where: { externalPlatform: 'BUBILET' }
    });

    if (count === 0) {
      return NextResponse.json({ ok: true, deleted: 0, message: 'Silinecek BUBILET etkinliği yok.' });
    }

    // İlgili ticket type'ları önce sil (foreign key constraint)
    const eventIds = await prisma.event.findMany({
      where: { externalPlatform: 'BUBILET' },
      select: { id: true }
    });
    const ids = eventIds.map(e => e.id);

    await prisma.ticketType.deleteMany({ where: { eventId: { in: ids } } });
    await prisma.favorite.deleteMany({ where: { eventId: { in: ids } } });

    const result = await prisma.event.deleteMany({
      where: { externalPlatform: 'BUBILET' }
    });

    return NextResponse.json({
      ok: true,
      deleted: result.count,
      message: `${result.count} BUBILET etkinliği silindi. Şimdi scraper'ı çalıştırın.`
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
