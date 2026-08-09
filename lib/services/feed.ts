import type { FeedPostStatus, FeedPostType, Prisma } from '@prisma/client';
import { prisma, ensureDbConnection, isDatabaseConfigured } from '@/lib/db/prisma';
import { uniqueSlug } from '@/lib/utils/slug';
import {
  DEFAULT_FEED_CATEGORIES,
  FEED_AUTHOR_NAME,
  FEED_CATEGORY_CONTENT_TYPES,
  FEED_CATEGORY_SHORT_LABELS,
  FEED_COVER_REQUIRED_MESSAGE,
  FEED_FALLBACK_COVER,
  isMissingFeedCoverImage
} from '@/lib/feed/constants';
import type { FeedPostCard, FeedPostDetail } from '@/lib/feed/types';

/** Kategori chip filtresi: atanmış kategori VEYA eşleşen contentType. */
function categoryFilterWhere(categorySlug: string): Prisma.FeedPostWhereInput {
  const types = FEED_CATEGORY_CONTENT_TYPES[categorySlug] ?? [];
  return {
    OR: [
      { feedCategory: { slug: categorySlug, deletedAt: null } },
      ...(types.length > 0 ? [{ contentType: { in: types } }] : [])
    ]
  };
}

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

/** Yayınlanmış VE gerçek kapak görseli olan haberler — herkese açık sorgularda
 * temel filtre. Görselsiz/placeholder haberler otomatik olarak yayından
 * gizlenir; admin görsel ekleyince otomatik olarak tekrar görünür olur. */
function publishedWithImageWhere(): Prisma.FeedPostWhereInput {
  return {
    status: 'published',
    deletedAt: null,
    publishedAt: { not: null },
    coverImage: { not: '' },
    NOT: [
      { coverImage: { contains: 'brand/logo' } },
      { coverImage: { contains: 'og-default' } },
      { coverImage: FEED_FALLBACK_COVER }
    ]
  };
}

/** Görseli eksik/placeholder olan haberler — admin panelindeki "Görsel Eksik"
 * sayaç ve filtresiyle aynı tanımı paylaşır (isMissingFeedCoverImage ile tutarlı). */
function missingImageWhere(): Prisma.FeedPostWhereInput {
  return {
    OR: [
      { coverImage: '' },
      { coverImage: { contains: 'brand/logo' } },
      { coverImage: { contains: 'og-default' } },
      { coverImage: FEED_FALLBACK_COVER }
    ]
  };
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
  /** Girişli kullanıcı — verilirse ve cursor yoksa (ilk sayfa), okunmamış
   * haberler önce, en yeniden en eskiye doğru sıralanır. Yeni haber yoksa
   * otomatik olarak kullanıcının henüz görmediği eski haberlere düşer. */
  userId?: string;
}): Promise<{ posts: FeedPostCard[]; nextCursor: string | null }> {
  if (!isDatabaseConfigured()) {
    return { posts: [], nextCursor: null };
  }

  try {
    await ensureDbConnection();
    const limit = Math.min(params.limit ?? 12, 24);
    const personalize = Boolean(params.userId) && !params.cursor;
    // Kişiselleştirme için daha geniş bir pencere çekip görülmemiş/görülmüş
    // olarak yeniden sıralıyoruz; normal sayfalarda pencere = limit + 1.
    const windowSize = personalize ? Math.min(limit * 3, 60) : limit + 1;

    const where: Prisma.FeedPostWhereInput = {
      ...publishedWithImageWhere(),
      ...(params.categorySlug ? categoryFilterWhere(params.categorySlug) : {}),
      ...(params.contentType ? { contentType: params.contentType } : {}),
      ...(params.featured ? { isFeatured: true } : {})
    };

    const rows = await prisma.feedPost.findMany({
      where,
      select: postCardSelect,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: windowSize,
      ...(params.cursor
        ? {
            cursor: { id: params.cursor },
            skip: 1
          }
        : {})
    });

    if (!personalize) {
      const hasMore = rows.length > limit;
      const slice = hasMore ? rows.slice(0, limit) : rows;
      return {
        posts: slice.map(mapPostCard),
        nextCursor: hasMore ? slice[slice.length - 1]?.id ?? null : null
      };
    }

    // Kullanıcının bu pencere içinde daha önce gördüğü haberleri bul
    const seenIds = new Set(
      (
        await prisma.feedView.findMany({
          where: { userId: params.userId, postId: { in: rows.map((r) => r.id) } },
          select: { postId: true }
        })
      ).map((v) => v.postId)
    );

    // Görülmemiş haberler önce (yeniden eskiye), sonra görülmüşler (yeniden eskiye)
    const unseen = rows.filter((r) => !seenIds.has(r.id));
    const seen = rows.filter((r) => seenIds.has(r.id));
    const ordered = [...unseen, ...seen];

    const hasMore = ordered.length > limit;
    const slice = hasMore ? ordered.slice(0, limit) : ordered;
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
      where: publishedWithImageWhere(),
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

/** En az bir yayınlanmış+görselli haberi olan kategorileri döner.
 * Sayaç kategori ataması VEYA eşleşen contentType üzerinden hesaplanır. */
export async function listFeedCategoriesWithPosts(): Promise<
  Array<{ slug: string; name: string; shortName: string; count: number }>
> {
  if (!isDatabaseConfigured()) return [];

  try {
    await ensureDbConnection();
    const categories = await prisma.feedCategory.findMany({
      where: { deletedAt: null, isActive: true },
      select: { slug: true, name: true },
      orderBy: { sortOrder: 'asc' }
    });

    const counts = await Promise.all(
      categories.map((cat) =>
        prisma.feedPost.count({
          where: { AND: [publishedWithImageWhere(), categoryFilterWhere(cat.slug)] }
        })
      )
    );

    return categories
      .map((cat, i) => ({
        slug: cat.slug,
        name: cat.name,
        shortName: FEED_CATEGORY_SHORT_LABELS[cat.slug] ?? cat.name,
        count: counts[i] ?? 0
      }))
      .filter((cat) => cat.count > 0);
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
      where: { slug, ...publishedWithImageWhere() },
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
              ...publishedWithImageWhere(),
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
      seo: (row.seo as {
        title?: string;
        description?: string;
        keywords?: string[] | string;
      }) ?? {}
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
        ...publishedWithImageWhere(),
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { summary: { contains: q, mode: 'insensitive' } },
          { tags: { has: q.toLowerCase() } },
          { artistName: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: postCardSelect,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
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
  missingImages: number;
}> {
  await ensureDbConnection();
  const [published, inReview, queuePending, views, missingImages] = await Promise.all([
    prisma.feedPost.count({ where: { status: 'published', deletedAt: null } }),
    prisma.feedPost.count({ where: { status: 'review', deletedAt: null } }),
    prisma.feedEditorialQueue.count({ where: { status: 'pending' } }),
    prisma.feedPost.aggregate({ _sum: { viewCount: true }, where: { deletedAt: null } }),
    prisma.feedPost.count({
      where: { deletedAt: null, ...missingImageWhere() }
    })
  ]);
  return {
    published,
    inReview,
    queuePending,
    totalViews: views._sum.viewCount ?? 0,
    missingImages
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
  seo?: { title?: string; description?: string; keywords?: string[] };
  aiProvider?: string;
  aiModel?: string;
  aiMetadata?: Record<string, unknown>;
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

  const data: Prisma.FeedPostUncheckedCreateInput = {
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
    seo: (input.seo ?? {}) as Prisma.InputJsonValue,
    aiProvider: input.aiProvider,
    aiModel: input.aiModel,
    ...(input.aiMetadata
      ? { aiMetadata: input.aiMetadata as Prisma.InputJsonValue }
      : {}),
    readingTimeMinutes: input.readingTimeMinutes ?? 3,
    eventId: input.eventId,
    organizerId: input.organizerId,
    cityId: input.cityId,
    venueId: input.venueId,
    artistName: input.artistName,
    feedCategoryId: input.feedCategoryId
  };

  const post = await prisma.feedPost.create({
    data,
    select: { id: true, slug: true }
  });

  return post;
}

export async function publishFeedPost(postId: string): Promise<void> {
  await ensureDbConnection();
  const existing = await prisma.feedPost.findFirst({
    where: { id: postId, deletedAt: null },
    select: { coverImage: true, isFeatured: true }
  });
  if (!existing) throw new Error('Haber bulunamadı');
  if (isMissingFeedCoverImage(existing.coverImage)) {
    throw new Error(FEED_COVER_REQUIRED_MESSAGE);
  }
  await prisma.feedPost.update({
    where: { id: postId },
    data: {
      status: 'published',
      editorialStage: 'publish',
      publishedAt: new Date()
    }
  });
}

/** Admin panelde toplu seçim ile birden çok haberi tek istekte (soft-delete) siler. */
export async function bulkDeleteFeedPosts(ids: string[]): Promise<number> {
  await ensureDbConnection();
  const result = await prisma.feedPost.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date(), status: 'archived' }
  });
  return result.count;
}

export async function listAdminFeedPosts(status?: FeedPostStatus, missingImageOnly = false) {
  await ensureDbConnection();
  return prisma.feedPost.findMany({
    where: {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(missingImageOnly ? missingImageWhere() : {})
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      contentType: true,
      coverImage: true,
      viewCount: true,
      likeCount: true,
      publishedAt: true,
      createdAt: true,
      isFeatured: true
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    // Eksik görselli haberler eski/yayınlanmamış olabilir ve normal 100'lük
    // pencerenin dışında kalabilir — filtre aktifken daha geniş bir pencere çekilir.
    take: missingImageOnly ? 300 : 100
  });
}

export type FeedMediaInput = {
  id?: string;
  type: 'image' | 'video' | 'embed' | 'reel';
  url: string;
  thumbnail?: string | null;
  alt?: string | null;
  caption?: string | null;
};

export type AdminFeedPostEditor = {
  id: string;
  slug: string;
  title: string;
  headline: string | null;
  summary: string;
  content: string;
  contentType: FeedPostType;
  status: FeedPostStatus;
  coverImage: string;
  tags: string[];
  isFeatured: boolean;
  feedCategoryId: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  artistName: string | null;
  readingTimeMinutes: number;
  aiProvider: string | null;
  aiModel: string | null;
  aiMetadata: Record<string, unknown>;
  seo: { title?: string; description?: string; keywords?: string[] };
  media: Array<{
    id: string;
    type: string;
    url: string;
    thumbnail: string | null;
    alt: string | null;
    caption: string | null;
    sortOrder: number;
  }>;
};

function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function listFeedCategoriesForAdmin() {
  await ensureFeedCategories();
  await ensureDbConnection();
  return prisma.feedCategory.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, slug: true, name: true },
    orderBy: { sortOrder: 'asc' }
  });
}

export async function getAdminFeedPostById(id: string): Promise<AdminFeedPostEditor | null> {
  await ensureDbConnection();
  // Admin route /admin/feed/[id] — slug gelirse Prisma UUID hatası vermesin
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }
  const row = await prisma.feedPost.findFirst({
    where: { id, deletedAt: null },
    include: {
      media: { orderBy: { sortOrder: 'asc' } },
      feedCategory: { select: { slug: true, name: true } }
    }
  });
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    headline: row.headline,
    summary: row.summary,
    content: row.content,
    contentType: row.contentType,
    status: row.status,
    coverImage: row.coverImage,
    tags: row.tags,
    isFeatured: row.isFeatured,
    feedCategoryId: row.feedCategoryId,
    categorySlug: row.feedCategory?.slug ?? null,
    categoryName: row.feedCategory?.name ?? null,
    artistName: row.artistName,
    readingTimeMinutes: row.readingTimeMinutes,
    aiProvider: row.aiProvider,
    aiModel: row.aiModel,
    aiMetadata: (row.aiMetadata as Record<string, unknown>) ?? {},
    seo: (row.seo as { title?: string; description?: string; keywords?: string[] }) ?? {},
    media: row.media.map((m) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      thumbnail: m.thumbnail,
      alt: m.alt,
      caption: m.caption,
      sortOrder: m.sortOrder
    }))
  };
}

async function syncFeedPostMedia(postId: string, media: FeedMediaInput[]): Promise<void> {
  await prisma.feedMedia.deleteMany({ where: { postId } });
  if (media.length === 0) return;
  await prisma.feedMedia.createMany({
    data: media.map((item, index) => ({
      postId,
      type: item.type,
      url: item.url,
      thumbnail: item.thumbnail ?? null,
      alt: item.alt ?? null,
      caption: item.caption ?? null,
      sortOrder: index,
      featured: index === 0
    }))
  });
}

export async function createManualAdminFeedPost(input: {
  title: string;
  headline?: string;
  summary: string;
  content: string;
  contentType: FeedPostType;
  coverImage: string;
  tags?: string[];
  isFeatured?: boolean;
  feedCategoryId?: string | null;
  status?: FeedPostStatus;
  media?: FeedMediaInput[];
  seo?: { title?: string; description?: string; keywords?: string[] };
  aiProvider?: string;
  aiModel?: string;
  aiMetadata?: Record<string, unknown>;
  readingTimeMinutes?: number;
}): Promise<{ id: string; slug: string }> {
  const missingCover = isMissingFeedCoverImage(input.coverImage);
  if (missingCover && (input.status === 'published' || input.isFeatured)) {
    throw new Error(FEED_COVER_REQUIRED_MESSAGE);
  }

  const readingTimeMinutes = input.readingTimeMinutes ?? estimateReadingMinutes(input.content);
  const post = await createFeedPostFromDraft({
    title: input.title,
    headline: input.headline,
    summary: input.summary,
    content: input.content,
    contentType: input.contentType,
    coverImage: missingCover ? '' : input.coverImage,
    tags: input.tags,
    feedCategoryId: input.feedCategoryId ?? undefined,
    status: input.status ?? 'review',
    readingTimeMinutes,
    seo: input.seo,
    aiProvider: input.aiProvider,
    aiModel: input.aiModel,
    aiMetadata: input.aiMetadata
  });

  if (input.media?.length) {
    await syncFeedPostMedia(post.id, input.media);
  }

  if (input.isFeatured && !missingCover) {
    await prisma.feedPost.update({
      where: { id: post.id },
      data: { isFeatured: true }
    });
  }

  if (input.status === 'published') {
    await publishFeedPost(post.id);
  }

  return post;
}

export async function updateAdminFeedPost(
  id: string,
  input: {
    title?: string;
    headline?: string | null;
    summary?: string;
    content?: string;
    contentType?: FeedPostType;
    coverImage?: string;
    tags?: string[];
    isFeatured?: boolean;
    feedCategoryId?: string | null;
    status?: FeedPostStatus;
    media?: FeedMediaInput[];
    seo?: { title?: string; description?: string; keywords?: string[] };
    aiProvider?: string | null;
    aiModel?: string | null;
    aiMetadata?: Record<string, unknown>;
    readingTimeMinutes?: number;
  }
): Promise<{ slug: string }> {
  await ensureDbConnection();
  const existing = await prisma.feedPost.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error('Haber bulunamadı');

  const nextCover = input.coverImage !== undefined ? input.coverImage : existing.coverImage;
  const missingCover = isMissingFeedCoverImage(nextCover);
  const nextStatus = input.status ?? existing.status;
  const nextFeatured = input.isFeatured !== undefined ? input.isFeatured : existing.isFeatured;

  if (missingCover && (nextStatus === 'published' || nextFeatured)) {
    throw new Error(FEED_COVER_REQUIRED_MESSAGE);
  }

  const content = input.content ?? existing.content;
  const readingTimeMinutes = input.readingTimeMinutes ?? estimateReadingMinutes(content);

  const shouldPublish = input.status === 'published' && existing.status !== 'published';

  const data: Prisma.FeedPostUncheckedUpdateInput = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.headline !== undefined ? { headline: input.headline } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    ...(input.content !== undefined ? { content: input.content, excerpt: input.content.slice(0, 280) } : {}),
    ...(input.contentType !== undefined ? { contentType: input.contentType } : {}),
    ...(input.coverImage !== undefined
      ? { coverImage: isMissingFeedCoverImage(input.coverImage) ? '' : input.coverImage }
      : {}),
    ...(input.tags !== undefined ? { tags: input.tags } : {}),
    ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
    ...(input.feedCategoryId !== undefined ? { feedCategoryId: input.feedCategoryId } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.seo !== undefined ? { seo: input.seo as Prisma.InputJsonValue } : {}),
    ...(input.aiProvider !== undefined ? { aiProvider: input.aiProvider } : {}),
    ...(input.aiModel !== undefined ? { aiModel: input.aiModel } : {}),
    ...(input.aiMetadata !== undefined
      ? { aiMetadata: input.aiMetadata as Prisma.InputJsonValue }
      : {}),
    readingTimeMinutes,
    ...(shouldPublish
      ? { publishedAt: new Date(), editorialStage: 'publish' as const }
      : {})
  };

  await prisma.feedPost.update({
    where: { id },
    data
  });

  if (input.media !== undefined) {
    await syncFeedPostMedia(id, input.media);
  }

  const updated = await prisma.feedPost.findUnique({ where: { id }, select: { slug: true } });
  return { slug: updated!.slug };
}
