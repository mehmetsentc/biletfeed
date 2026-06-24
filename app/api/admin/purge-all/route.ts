import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/permissions';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/purge-all
 * Tüm harici platform etkinliklerini hard-delete eder (BUBILET, PASSO, BILETINO vb.)
 * Temiz re-scrape için kullanılır.
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
    const total = await prisma.event.count({
      where: { listingType: 'external' }
    });

    if (total === 0) {
      return NextResponse.json({ ok: true, deleted: 0, message: 'Silinecek harici etkinlik yok.' });
    }

    // Platform bazlı sayım (log için)
    const platformCounts = await prisma.event.groupBy({
      by: ['externalPlatform'],
      where: { listingType: 'external' },
      _count: { id: true }
    });

    const eventIds = await prisma.event.findMany({
      where: { listingType: 'external' },
      select: { id: true }
    });
    const ids = eventIds.map(e => e.id);

    await prisma.ticketType.deleteMany({ where: { eventId: { in: ids } } });
    await prisma.favorite.deleteMany({ where: { eventId: { in: ids } } });

    const result = await prisma.event.deleteMany({
      where: { listingType: 'external' }
    });

    const breakdown = Object.fromEntries(
      platformCounts.map(p => [p.externalPlatform ?? 'unknown', p._count.id])
    );

    return NextResponse.json({
      ok: true,
      deleted: result.count,
      breakdown,
      message: `${result.count} harici etkinlik silindi. Scraper'ı çalıştırabilirsiniz.`
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
