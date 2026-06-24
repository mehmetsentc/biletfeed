import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/permissions';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/publish-pending
 * Tüm pending harici etkinlikleri published yapar.
 */
export async function POST(request: NextRequest) {
  const session = await verifySessionCookie();
  if (!session || !canAccessAdmin(session.role as never)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  }

  await ensureDbConnection();

  const result = await prisma.event.updateMany({
    where: { status: 'pending', listingType: 'external', deletedAt: null },
    data: { status: 'published' }
  });

  return NextResponse.json({
    ok: true,
    published: result.count,
    message: `${result.count} etkinlik yayına alındı.`
  });
}
