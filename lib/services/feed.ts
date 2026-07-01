import type { FeedPostStatus, FeedPostType, Prisma } from '@prisma/client';
import { prisma, ensureDbConnection, isDatabaseConfigured } from '@/lib/db/prisma';
import { uniqueSlug } from '@/lib/utils/slug';
import { DEFAULT_FEED_CATEGORIES, FEED_AUTHOR_NAME } from '@/lib/feed/constants';
import type { FeedPostCard, FeedPostDetail } from '@/lib/feed/types';

function isFeedDbUnavailable(error: unknown): boolean {
  if (!isDatabaseConfigured()) return true;
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : '';
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === 'P2021' ||
    code === 'P2022' ||
    message.includes('feed_categories') ||
    message.includes('feed_posts') ||
    message.includes('does not exist')
  );
}

const postCardSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  coverImage: true,
  contentType: true,
  authorName: true,
  readingTimeMinutes: true,
  viewCount: true,
  likeCount: true,
  commentCount: true,
  publishedAt: true,
  isFeatured: true,
  tags: true,
  feedCategory: { select: { slug: true, name: true } },
  event: { select: { slug: true, title: true } },
  city: { select: { name: true } }
} satisfies Prisma.FeedPostSelect;

function mapPostCard(row: Prisma.FeedPostGetPayload<{ select: typeof postCardSelect }>): FeedPostCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    coverImage: row.coverImage,
    contentType: row.contentType,
    authorName: row.authorName,
    readingTimeMinutes: row.readingTimeMinutes,
    viewCount: row.viewCount,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    isFeatured: row.isFeatured,
    categorySlug: row.feedCategory?.slug ?? null,
    categoryName: row.feedCategory?.name ?? null,
    eventSlug: row.event?.slug ?? null,
    eventTitle: row.event?.title ?? null,
    cityName: row.city?.name ?? null,
    tags: row.tags
  };
}

export async function ensureFeedCategories(): Promise<void> {
  if (!isDatabaseConfigured()) return;

  try {
    await ensureDbConnection();
    for (const cat of DEFAULT_FEED_CATEGORIES) {
      await prisma.feedCategory.upsert({
        where: { slug: cat.slug },
        create: {
          slug: cat.slug,
          name: cat.name,
          description: cat.description,
          sortOrder: cat.sortOrder
        },
        update: {
          name: cat.name,
          description: cat.description,
          sortOrder: cat.sortOrder,
          isActive: true,
          deletedAt: null
        }
      });
    }
  } catch (error) {
    if (isFeedDbUnavailable(error)) return;
    throw error;
  }
}

export async function listPublishedFeedPosts(params: {
  cursor?: string;
  limit?: number;
  categorySlug?: string;
  contentType?: FeedPostType;
  featured?: boolean;
}): Promise<{ posts: FeedPostCard[]; nextCursor: string | null }> {
  if (!isDatabaseConfigured()) {
    return { posts: [], nextCursor: null };
  }

  try {
    await ensureDbConnection();
    const limit = Math.min(params.limit ?? 12, 24);

    const rows = await prisma.feedPost.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        publishedAt: { not: null },
        ...(params.categorySlug
          ? { feedCategory: { slug: params.categorySlug, deletedAt: null } }
          : {}),
        ...(params.contentType ? { contentType: params.contentType } : {}),
        ...(params.featured ? { isFeatured: true } : {})
      },
      select: postCardSelect,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      take: limit + 1,
      ...(params.cursor
        ? {
            cursor: { id: params.cursor },
            skip: 1
          }
        : {})
    });

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    return {
      posts: slice.map(mapPostCard),
      nextCursor: hasMore ? slice[slice.length - 1]?.id ?? null : null
    };
  } catch (error) {
    if (isFeedDbUnavailable(error)) {
      return { posts: [], nextCursor: null };
    }
    throw error;
  }
}

export async function getTrendingFeedPosts(limit = 6): Promise<FeedPostCard[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    await ensureDbConnection();
    const rows = await prisma.feedPost.findMany({
      where: { status: 'published', deletedAt: null, publishedAt: { not: null } },
      select: postCardSelect,
      orderBy: [{ trendingScore: 'desc' }, { viewCount: 'desc' }],
      take: limit
    });
    return rows.map(mapPostCard);
  } catch (error) {
    if (isFeedDbUnavailable(error)) return [];
    throw error;
  }
}

export async function getFeedPostBySlug(slug: string): Promise<FeedPostDetail | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    await ensureDbConnection();
    const row = await prisma.feedPost.findFirst({
      where: { slug, status: 'published', deletedAt: null },
      include: {
        feedCategory: { select: { slug: true, name: true } },
        event: {
          select: {
            id: true,
            slug: true,
            title: true,
            listingType: true,
            ticketTypes: { where: { deletedAt: null, status: 'active' }, select: { id: true }, take: 1 }
          }
        },
        organizer: { select: { slug: true, name: true } },
        city: { select: { name: true } },
        venue: { select: { name: true } },
        media: { orderBy: { sortOrder: 'asc' } }
      }
    });
    if (!row) return null;

    const relatedFilters = [
      row.feedCategoryId ? { feedCategoryId: row.feedCategoryId } : null,
      row.eventId ? { eventId: row.eventId } : null,
      row.cityId ? { cityId: row.cityId } : null
    ].filter((clause): clause is { feedCategoryId: string } | { eventId: string } | { cityId: string } => clause !== null);

    const related =
      relatedFilters.length > 0
        ? await prisma.feedPost.findMany({
            where: {
              status: 'published',
              deletedAt: null,
              id: { not: row.id },
              OR: relatedFilters
            },
            select: postCardSelect,
            orderBy: { publishedAt: 'desc' },
            take: 4
          })
        : [];

    return {
      ...mapPostCard({
        ...row,
        feedCategory: row.feedCategory,
        event: row.event ? { slug: row.event.slug, title: row.event.title } : null,
        city: row.city
      }),
      headline: row.headline,
      content: row.content,
      excerpt: row.excerpt,
      sourceUrl: row.sourceUrl,
      sourceName: row.sourceName,
      sourceAttribution: row.sourceAttribution,
      bookmarkCount: row.bookmarkCount,
      shareCount: row.shareCount,
      artistName: row.artistName,
      organizerSlug: row.organizer?.slug ?? null,
      organizerName: row.organizer?.name ?? null,
      venueName: row.venue?.name ?? null,
      eventId: row.event?.id ?? null,
      eventHasTickets: Boolean(row.event?.ticketTypes.length),
      media: row.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        thumbnail: m.thumbnail,
        alt: m.alt,
        caption: m.caption
      })),
      relatedPosts: related.map(mapPostCard),
      seo: (row.seo as Record<string, string>) ?? {}
    };
  } catch (error) {
    if (isFeedDbUnavailable(error)) return null;
    throw error;
  }
}

export async function recordFeedView(postId: string, userId?: string, ipHash?: string): Promise<void> {
  if (!isDatabaseConfigured()) return;

  try {
    await ensureDbConnection();
    await prisma.$transaction([
      prisma.feedView.create({
        data: { postId, userId: userId ?? null, ipHash: ipHash ?? null }
      }),
      prisma.feedPost.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 }, trendingScore: { increment: 0.1 } }
      })
    ]);
  } catch (error) {
    if (isFeedDbUnavailable(error)) return;
    throw error;
  }
}

export async function toggleFeedLike(postId: string, userId: string): Promise<{ liked: boolean }> {
  await ensureDbConnection();
  const existing = await prisma.feedLike.findUnique({
    where: { postId_userId: { postId, userId } }
  });

  if (existing) {
    await prisma.$transaction([
      prisma.feedLike.delete({ where: { id: existing.id } }),
      prisma.feedPost.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } }
      })
    ]);
    return { liked: false };
  }

  await prisma.$transaction([
    prisma.feedLike.create({ data: { postId, userId } }),
    prisma.feedPost.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 }, trendingScore: { increment: 1 } }
    })
  ]);
  return { liked: true };
}

export async function toggleFeedBookmark(postId: string, userId: string): Promise<{ bookmarked: boolean }> {
  await ensureDbConnection();
  const existing = await prisma.feedBookmark.findUnique({
    where: { postId_userId: { postId, userId } }
  });

  if (existing) {
    await prisma.$transaction([
      prisma.feedBookmark.delete({ where: { id: existing.id } }),
      prisma.feedPost.update({ where: { id: postId }, data: { bookmarkCount: { decrement: 1 } } })
    ]);
    return { bookmarked: false };
  }

  await prisma.$transaction([
    prisma.feedBookmark.create({ data: { postId, userId } }),
    prisma.feedPost.update({ where: { id: postId }, data: { bookmarkCount: { increment: 1 } } })
  ]);
  return { bookmarked: true };
}

export async function searchFeedPosts(query: string, limit = 12): Promise<FeedPostCard[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    await ensureDbConnection();
    const q = query.trim();
    if (!q) return [];

    const rows = await prisma.feedPost.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { summary: { contains: q, mode: 'insensitive' } },
          { tags: { has: q.toLowerCase() } },
          { artistName: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: postCardSelect,
      orderBy: { publishedAt: 'desc' },
      take: limit
    });
    return rows.map(mapPostCard);
  } catch (error) {
    if (isFeedDbUnavailable(error)) return [];
    throw error;
  }
}

export async function getFeedAdminStats(): Promise<{
  published: number;
  inReview: number;
  queuePending: number;
  totalViews: number;
}> {
  await ensureDbConnection();
  const [published, inReview, queuePending, views] = await Promise.all([
    prisma.feedPost.count({ where: { status: 'published', deletedAt: null } }),
    prisma.feedPost.count({ where: { status: 'review', deletedAt: null } }),
    prisma.feedEditorialQueue.count({ where: { status: 'pending' } }),
    prisma.feedPost.aggregate({ _sum: { viewCount: true }, where: { deletedAt: null } })
  ]);
  return {
    published,
    inReview,
    queuePending,
    totalViews: views._sum.viewCount ?? 0
  };
}

export async function createFeedPostFromDraft(input: {
  title: string;
  headline?: string;
  summary: string;
  content: string;
  excerpt?: string;
  contentType: FeedPostType;
  coverImage: string;
  tags?: string[];
  sourceUrl?: string;
  sourceName?: string;
  sourceAttribution?: string;
  seo?: Record<string, string>;
  aiProvider?: string;
  aiModel?: string;
  readingTimeMinutes?: number;
  eventId?: string;
  organizerId?: string;
  cityId?: string;
  venueId?: string;
  artistName?: string;
  feedCategoryId?: string;
  status?: FeedPostStatus;
}): Promise<{ id: string; slug: string }> {
  await ensureDbConnection();
  const slug = await uniqueSlug(input.title, async (s) => {
    const row = await prisma.feedPost.findUnique({ where: { slug: s } });
    return Boolean(row);
  });

  const post = await prisma.feedPost.create({
    data: {
      slug,
      title: input.title,
      headline: input.headline ?? input.title,
      summary: input.summary,
      content: input.content,
      excerpt: input.excerpt ?? input.summary,
      contentType: input.contentType,
      status: input.status ?? 'review',
      editorialStage: 'review',
      coverImage: input.coverImage,
      authorName: FEED_AUTHOR_NAME,
      tags: input.tags ?? [],
      sourceUrl: input.sourceUrl,
      sourceName: input.sourceName,
      sourceAttribution: input.sourceAttribution,
      seo: input.seo ?? {},
      aiProvider: input.aiProvider,
      aiModel: input.aiModel,
      readingTimeMinutes: input.readingTimeMinutes ?? 3,
      eventId: input.eventId,
      organizerId: input.organizerId,
      cityId: input.cityId,
      venueId: input.venueId,
      artistName: input.artistName,
      feedCategoryId: input.feedCategoryId
    },
    select: { id: true, slug: true }
  });

  return post;
}

export async function publishFeedPost(postId: string): Promise<void> {
  await ensureDbConnection();
  await prisma.feedPost.update({
    where: { id: postId },
    data: {
      status: 'published',
      editorialStage: 'publish',
      publishedAt: new Date()
    }
  });
}

export async function listAdminFeedPosts(status?: FeedPostStatus) {
  await ensureDbConnection();
  return prisma.feedPost.findMany({
    where: { deletedAt: null, ...(status ? { status } : {}) },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      contentType: true,
      viewCount: true,
      likeCount: true,
      publishedAt: true,
      createdAt: true,
      isFeatured: true
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}
