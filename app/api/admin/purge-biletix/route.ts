import { NextRequest, NextResponse } from 'next/server';
import { guardAdminAutomationOrMutation } from '@/lib/auth/guard-admin-api';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const guard = await guardAdminAutomationOrMutation(request, 'events.scrape');
  if ('error' in guard) return guard.error;

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
