import { FeedGridClient } from '@/components/feed/feed-grid-client';
import { FeedCategoryChips } from '@/components/feed/feed-category-chips';
import { createFeedListMetadata } from '@/lib/seo/feed-metadata';
import {
  ensureFeedCategories,
  listPublishedFeedPosts,
  getTrendingFeedPosts,
  listFeedCategoriesWithPosts
} from '@/lib/services/feed';
import { verifySessionCookie } from '@/lib/auth/session';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getSelectedCityNameOrNull } from '@/lib/location/city-preference.server';

export const metadata = createFeedListMetadata();

export const revalidate = 0;

async function resolveCurrentUserId(): Promise<string | undefined> {
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

interface Props {
  searchParams: Promise<{ kategori?: string }>;
}

export default async function FeedPage({ searchParams }: Props) {
  const { kategori } = await searchParams;
  const categorySlug = kategori || undefined;

  await ensureFeedCategories();
  const userId = await resolveCurrentUserId();
  const preferredCityName = await getSelectedCityNameOrNull();
  const [{ posts, nextCursor }, trending, categories] = await Promise.all([
    listPublishedFeedPosts({ limit: 12, userId, categorySlug, preferredCityName }),
    getTrendingFeedPosts(6, preferredCityName),
    listFeedCategoriesWithPosts()
  ]);

  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const pageTitle = activeCategory
    ? (activeCategory.shortName ?? activeCategory.name)
    : 'Gündem';
  const pageSubtitle = activeCategory
    ? `${activeCategory.name} — konser, festival ve sahne haberleri`
    : 'Konser, festival, party ve sanatçı haberleri — taranabilir, güncel akış';

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-gradient-to-b from-card/80 to-background pb-5 pt-5 md:pb-7 md:pt-8">
        <div className="container mx-auto px-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            BiletFeed
          </p>
          <h1 className="mt-2 text-[1.75rem] font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {pageTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground md:text-base">
            {pageSubtitle}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-5 md:py-8">
        <FeedCategoryChips categories={categories} activeSlug={categorySlug} />
        <FeedGridClient
          initialPosts={posts}
          initialCursor={nextCursor}
          trending={categorySlug ? [] : trending}
          categorySlug={categorySlug}
        />
      </div>
    </div>
  );
}
