import { NextRequest, NextResponse } from 'next/server';
import { guardAdminAutomationOrMutation } from '@/lib/auth/guard-admin-api';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const guard = await guardAdminAutomationOrMutation(request, 'events.scrape');
  if ('error' in guard) return guard.error;

  await ensureDbConnection();

  try {
    const count = await prisma.event.count({
      where: { externalPlatform: 'BUBILET' }
    });

    if (count === 0) {
      return NextResponse.json({ ok: true, deleted: 0, message: 'BUBILET etkinliği yok' });
    }

    await prisma.event.deleteMany({ where: { externalPlatform: 'BUBILET' } });

    return NextResponse.json({
      ok: true,
      deleted: count,
      message: `${count} BUBILET etkinliği silindi`
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
