import { HomeFeedTabs } from '@/components/feed/home-feed-tabs';
import { FeedGridClient } from '@/components/feed/feed-grid-client';
import { createFeedListMetadata } from '@/lib/seo/feed-metadata';
import { ensureFeedCategories, listPublishedFeedPosts, getTrendingFeedPosts } from '@/lib/services/feed';
import { FeedPostCardView } from '@/components/feed/feed-post-card';

export const metadata = createFeedListMetadata();

export const revalidate = 300;

export default async function FeedPage() {
  await ensureFeedCategories();
  const [{ posts, nextCursor }, trending] = await Promise.all([
    listPublishedFeedPosts({ limit: 12 }),
    getTrendingFeedPosts(4)
  ]);

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-card/50 py-6">
        <div className="container mx-auto px-4">
          <HomeFeedTabs />
          <div className="mt-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              BiletFeed Feed
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Konser haberleri, festival gündemi, sanatçı duyuruları ve etkinlik rehberleri — her gün
              yeni bir keşif.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {trending.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-bold text-foreground">Trend Hikâyeler</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((post) => (
                <FeedPostCardView key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        <FeedGridClient initialPosts={posts} initialCursor={nextCursor} />
      </div>
    </div>
  );
}
