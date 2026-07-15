import { NextRequest, NextResponse } from 'next/server';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'events.manage');
  if ('error' in guard) return guard.error;

  const { id } = await params;
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null }
  });

  if (!event) {
    return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 });
  }

  if (event.status === 'cancelled') {
    return NextResponse.json({ error: 'Etkinlik zaten iptal edilmiş' }, { status: 400 });
  }

  await prisma.event.update({
    where: { id },
    data: { status: 'cancelled' }
  });

  return NextResponse.json({ ok: true });
}
