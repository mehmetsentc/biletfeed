import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { requestWalletPass } from '@/lib/services/ticket-ops';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

const bodySchema = z.object({
  platform: z.enum(['apple', 'google'])
});

type RouteParams = { params: Promise<{ ticketId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await verifySessionCookie();
  if (!session) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });

  const { ticketId } = await params;
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz platform' }, { status: 400 });
  }

  await ensureDbConnection();
  const user = await prisma.user.findFirst({
    where: { firebaseUid: session.uid, deletedAt: null },
    select: { id: true }
  });
  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

  try {
    const result = await requestWalletPass(ticketId, user.id, parsed.data.platform);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Wallet isteği başarısız' },
      { status: 400 }
    );
  }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await verifySessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  }

  const { ticketId } = await params;
  await ensureDbConnection();

  const user = await prisma.user.findFirst({
    where: { firebaseUid: session.uid, deletedAt: null },
    select: { id: true }
  });
  if (!user) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
  }

  const ticket = await prisma.purchasedTicket.findFirst({
    where: { id: ticketId, userId: user.id, deletedAt: null },
    select: { id: true }
  });
  if (!ticket) {
    return NextResponse.json({ error: 'Bilet bulunamadı' }, { status: 404 });
  }

  const passes = await prisma.walletPass.findMany({
    where: { ticketId },
    select: { platform: true, status: true, updatedAt: true }
  });

  return NextResponse.json({ passes });
}
