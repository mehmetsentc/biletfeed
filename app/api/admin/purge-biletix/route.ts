import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/permissions';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/purge-biletix
 * Veritabanındaki tüm BILETIX kaynaklı etkinlikleri siler.
 * Sadece admin rolü erişebilir.
 */
export async function POST(request: NextRequest) {
  // CRON_SECRET ile çağrı da kabul et (otomatik temizlik için)
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
    // Önce etkinliğe bağlı kayıtları say
    const count = await prisma.event.count({
      where: { externalPlatform: 'BILETIX' }
    });

    if (count === 0) {
      return NextResponse.json({ ok: true, deleted: 0, message: 'Silinecek BILETIX etkinliği yok.' });
    }

    // Soft-delete: deletedAt set et (hard delete istenirse deleteMany kullan)
    const result = await prisma.event.updateMany({
      where: { externalPlatform: 'BILETIX', deletedAt: null },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({
      ok: true,
      deleted: result.count,
      message: `${result.count} BILETIX etkinliği arşivden silindi.`
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
