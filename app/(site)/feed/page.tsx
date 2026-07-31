import { HomeFeedTabs } from '@/components/feed/home-feed-tabs';
import { FeedGridClient } from '@/components/feed/feed-grid-client';
import { FeedMagazineCard } from '@/components/feed/feed-magazine-card';
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
  const [{ posts, nextCursor }, trending, categories] = await Promise.all([
    listPublishedFeedPosts({ limit: 12, userId, categorySlug }),
    getTrendingFeedPosts(4),
    listFeedCategoriesWithPosts()
  ]);

  return (
    <div className="bg-background">
      {/* Mobile billboard header */}
      <section className="border-b border-border bg-card/50 pb-6 pt-4 md:py-6">
        <div className="container mx-auto px-4">
          <HomeFeedTabs />
          <div className="mt-6 text-center md:mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary md:hidden">
              Etkinlik Gündemi
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground md:mt-0 md:text-4xl">
              BiletFeed Feed
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Konser haberleri, festival gündemi, sanatçı duyuruları ve etkinlik rehberleri — her gün
              yeni bir keşif.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <FeedCategoryChips categories={categories} activeSlug={categorySlug} />

        {/* Desktop trending */}
        {trending.length > 0 && !categorySlug && (
          <section className="mb-10 hidden md:block">
            <h2 className="mb-4 text-lg font-bold text-foreground">Trend Hikâyeler</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((post) => (
                <FeedMagazineCard key={post.id} post={post} size="small" />
              ))}
            </div>
          </section>
        )}

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
