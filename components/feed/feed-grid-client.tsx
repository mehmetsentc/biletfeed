'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { FeedPostCardView } from '@/components/feed/feed-post-card';
import { FeedBillboardHero } from '@/components/feed/feed-billboard-hero';
import { FeedTimelineCard } from '@/components/feed/feed-timeline-card';
import { Button } from '@/components/ui/button';
import { groupFeedPostsByDate } from '@/lib/feed/format-date';
import type { FeedPostCard } from '@/lib/feed/types';

export function FeedGridClient({
  initialPosts,
  initialCursor,
  trending = []
}: {
  initialPosts: FeedPostCard[];
  initialCursor: string | null;
  trending?: FeedPostCard[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}`);
      const data = (await res.json()) as { posts: FeedPostCard[]; nextCursor: string | null };
      setPosts((prev) => [...prev, ...data.posts]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center md:border-border">
        <p className="text-lg font-semibold text-foreground">Feed henüz boş</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Konser ve festival haberleri yakında burada olacak. Şimdilik etkinlikleri keşfedin.
        </p>
        <Button asChild className="mt-6">
          <Link href="/etkinlikler">Etkinlikleri Keşfet</Link>
        </Button>
      </div>
    );
  }

  const heroPost = trending[0] ?? posts[0]!;
  const heroId = heroPost.id;
  const timelinePosts = posts.filter((p) => p.id !== heroId);
  const dateGroups = groupFeedPostsByDate(timelinePosts);
  const flatTimeline = dateGroups.flatMap((g) => g.posts);
  const [featured, ...rest] = posts.filter((p) => p.id !== heroId || trending.length === 0);

  return (
    <>
      {/* ── Mobile: billboard + timeline ── */}
      <div className="md:hidden">
        <section className="mb-8">
          <FeedBillboardHero post={heroPost} />
        </section>

        {trending.length > 1 && (
          <section className="mb-8">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Trend Hikâyeler
            </h2>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {trending.slice(1, 5).map((post) => (
                <Link
                  key={post.id}
                  href={`/feed/${post.slug}`}
                  className="w-[72vw] max-w-[280px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900"
                >
                  <div
                    className="h-28 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${post.coverImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80'})`
                    }}
                  />
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-white">
                      {post.title}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">{post.readingTimeMinutes} dk okuma</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Gündem</p>
              <h2 className="mt-1 text-xl font-extrabold text-white">Haber Akışı</h2>
            </div>
            <span className="text-xs text-zinc-500">{flatTimeline.length + 1} hikâye</span>
          </div>

          <div className="relative">
            {flatTimeline.map((post, index) => (
              <FeedTimelineCard
                key={post.id}
                post={post}
                isFirst={index === 0}
                isLast={index === flatTimeline.length - 1 && !cursor}
              />
            ))}
          </div>
        </section>

        {cursor && (
          <div className="flex justify-center pb-4 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => void loadMore()}
              className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Yükleniyor…
                </>
              ) : (
                'Daha fazla hikâye'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* ── Desktop: grid layout ── */}
      <div className="hidden space-y-8 md:block">
        {featured && (
          <section>
            <FeedPostCardView post={featured} featured />
          </section>
        )}

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <FeedPostCardView key={post.id} post={post} />
          ))}
        </section>

        {cursor && (
          <div className="flex justify-center pt-2">
            <Button type="button" variant="outline" disabled={loading} onClick={() => void loadMore()}>
              {loading ? 'Yükleniyor…' : 'Daha fazla göster'}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
