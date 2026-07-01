import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { toggleFeedLike } from '@/lib/services/feed';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

type Params = { params: Promise<{ id: string }> };

async function resolveUserId() {
  const session = await verifySessionCookie();
  if (!session) return null;
  await ensureDbConnection();
  const user = await prisma.user.findFirst({
    where: { firebaseUid: session.uid, deletedAt: null },
    select: { id: true }
  });
  return user?.id ?? null;
}

export async function POST(request: NextRequest, { params }: Params) {
  const limited = rateLimitOrNull(request, 'feed-like', 60, 60_000);
  if (limited) return limited;
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const userId = await resolveUserId();
  if (!userId) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });

  const { id } = await params;
  const result = await toggleFeedLike(id, userId);
  return NextResponse.json(result);
}
