import { NextRequest, NextResponse } from 'next/server';
import { listPublishedFeedPosts, searchFeedPosts } from '@/lib/services/feed';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

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
  const result = await listPublishedFeedPosts({
    cursor,
    categorySlug,
    limit: 12
  });

  return NextResponse.json(result);
}
