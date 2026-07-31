import { NextRequest, NextResponse } from 'next/server';
import { listPublishedFeedPosts, searchFeedPosts } from '@/lib/services/feed';
import { rateLimitOrNull } from '@/lib/security/rate-limit';
import { verifySessionCookie } from '@/lib/auth/session';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

async function resolveUserId(): Promise<string | undefined> {
  try {
    const session = await verifySessionCookie();
    if (!session) return undefined;
    await ensureDbConnection();
    const user = await prisma.user.findFirst({
      where: { firebaseUid: session.uid, deletedAt: null },
      select: { id: true }
    });
    return user?.id ?? undefined;
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  const limited = rateLimitOrNull(request, 'feed-list', 120, 60_000);
  if (limited) return limited;

  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q');
  if (q) {
    const posts = await searchFeedPosts(q);
    return NextResponse.json({ posts, nextCursor: null });
  }

  const cursor = searchParams.get('cursor') || undefined;
  const categorySlug = searchParams.get('category') || undefined;
  // Kişiselleştirme (okunmamış-önce sıralama) yalnızca ilk sayfada uygulanır
  const userId = cursor ? undefined : await resolveUserId();
  const result = await listPublishedFeedPosts({
    cursor,
    categorySlug,
    limit: 12,
    userId
  });

  return NextResponse.json(result);
}
