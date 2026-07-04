import { NextRequest, NextResponse } from 'next/server';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const guard = await guardAdminMutation(request, 'events.approve');
  if ('error' in guard) return guard.error;

  await ensureDbConnection();

  const result = await prisma.event.updateMany({
    where: { status: 'pending', listingType: 'external', deletedAt: null },
    data: { status: 'published' }
  });

  return NextResponse.json({
    ok: true,
    published: result.count,
    message: `${result.count} pending etkinlik published yapıldı`
  });
}
