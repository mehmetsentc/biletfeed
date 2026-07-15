import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { followArtist, unfollowArtist, isFollowingArtist } from '@/lib/services/artist';

/** POST /api/artists/[id]/follow — Toggle follow */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }
  const session = await verifySessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  }

  const { id: artistId } = await params;

  // Resolve firebase uid → db user id
  const user = await prisma.user.findUnique({
    where: { firebaseUid: session.uid },
    select: { id: true }
  });
  if (!user) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
  }

  const currently = await isFollowingArtist(user.id, artistId);
  if (currently) {
    await unfollowArtist(user.id, artistId);
    return NextResponse.json({ following: false });
  } else {
    await followArtist(user.id, artistId);
    return NextResponse.json({ following: true });
  }
}

/** GET /api/artists/[id]/follow — Check if current user follows artist */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySessionCookie();
  if (!session) return NextResponse.json({ following: false });

  const { id: artistId } = await params;
  const user = await prisma.user.findUnique({
    where: { firebaseUid: session.uid },
    select: { id: true }
  });
  if (!user) return NextResponse.json({ following: false });

  const following = await isFollowingArtist(user.id, artistId);
  return NextResponse.json({ following });
}
