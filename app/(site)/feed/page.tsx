import { HomeFeedTabs } from '@/components/feed/home-feed-tabs';
import { FeedGridClient } from '@/components/feed/feed-grid-client';
import { FeedPostCardView } from '@/components/feed/feed-post-card';
import { createFeedListMetadata } from '@/lib/seo/feed-metadata';
import { ensureFeedCategories, listPublishedFeedPosts, getTrendingFeedPosts } from '@/lib/services/feed';

export const metadata = createFeedListMetadata();

export const revalidate = 300;

export default async function FeedPage() {
  await ensureFeedCategories();
  const [{ posts, nextCursor }, trending] = await Promise.all([
    listPublishedFeedPosts({ limit: 12 }),
    getTrendingFeedPosts(4)
  ]);

  return (
    <div className="min-h-screen bg-background md:bg-background">
      {/* Mobile billboard header */}
      <section className="border-b border-white/10 bg-[#0c1017] pb-6 pt-4 md:border-border md:bg-card/50 md:py-6">
        <div className="container mx-auto px-4">
          <HomeFeedTabs variant="dark" />
          <div className="mt-6 text-center md:mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary md:hidden">
              Etkinlik Gündemi
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:mt-0 md:text-4xl md:text-foreground">
              BiletFeed Feed
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base md:text-muted-foreground">
              Konser haberleri, festival gündemi, sanatçı duyuruları ve etkinlik rehberleri — her gün
              yeni bir keşif.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Desktop trending */}
        {trending.length > 0 && (
          <section className="mb-10 hidden md:block">
            <h2 className="mb-4 text-lg font-bold text-foreground">Trend Hikâyeler</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((post) => (
                <FeedPostCardView key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        <div className="md:contents">
          <div className="rounded-none bg-[#0c1017] px-0 py-2 md:rounded-none md:bg-transparent md:p-0">
            <FeedGridClient
              initialPosts={posts}
              initialCursor={nextCursor}
              trending={trending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
