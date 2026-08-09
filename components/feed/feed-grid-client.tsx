'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { FeedCoverImage } from '@/components/feed/feed-cover-image';
import { FeedLeadStory } from '@/components/feed/feed-lead-story';
import { FeedFeatureTile } from '@/components/feed/feed-feature-tile';
import { FeedStoryRow } from '@/components/feed/feed-story-row';
import { FeedRecentSidebar } from '@/components/feed/feed-recent-sidebar';
import { Button } from '@/components/ui/button';
import { isMissingFeedCoverImage } from '@/lib/feed/constants';
import type { FeedPostCard } from '@/lib/feed/types';

export function FeedGridClient({
  initialPosts,
  initialCursor,
  trending = [],
  categorySlug
}: {
  initialPosts: FeedPostCard[];
  initialCursor: string | null;
  trending?: FeedPostCard[];
  categorySlug?: string;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const url = `/api/feed?cursor=${encodeURIComponent(cursor)}${
        categorySlug ? `&category=${encodeURIComponent(categorySlug)}` : ''
      }`;
      const res = await fetch(url);
      const data = (await res.json()) as { posts: FeedPostCard[]; nextCursor: string | null };
      setPosts((prev) => [...prev, ...data.posts]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, categorySlug]);

  useEffect(() => {
    setPosts(initialPosts);
    setCursor(initialCursor);
  }, [initialPosts, initialCursor, categorySlug]);

  useEffect(() => {
    if (!cursor) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: '480px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="text-lg font-semibold text-foreground">Bu kategoride henüz haber yok</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Konser, festival ve sanatçı gündemi yakında burada olacak.
        </p>
        <Button asChild className="mt-6">
          <Link href="/feed">Tüm gündeme dön</Link>
        </Button>
      </div>
    );
  }

  const lead = posts[0]!;
  const secondary = posts.slice(1, 4);
  const list = posts.slice(4);
  const sidebarPosts = (trending.length > 0 ? trending : posts)
    .filter((p) => p.id !== lead.id)
    .slice(0, 8);

  return (
    <div className="space-y-8 md:space-y-10">
      <section aria-label="Manşet">
        <FeedLeadStory post={lead} />
      </section>

      {secondary.length > 0 && (
        <section aria-label="Öne çıkanlar">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Öne çıkanlar
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {secondary.map((post) => (
              <FeedFeatureTile key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section aria-label="Son haberler">
          {list.length > 0 && (
            <>
              <div className="mb-1 flex items-end justify-between gap-3 border-b border-border pb-3">
                <h2 className="text-lg font-extrabold tracking-tight text-foreground md:text-xl">
                  Son haberler
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {posts.length} hikâye
                </span>
              </div>
              <div>
                {list.map((post) => (
                  <FeedStoryRow key={post.id} post={post} />
                ))}
              </div>
            </>
          )}
        </section>

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <FeedRecentSidebar posts={sidebarPosts} />
          </div>
        </div>
      </div>

      {sidebarPosts.length > 0 && (
        <section className="lg:hidden" aria-label="Trend">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Trend
          </h2>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sidebarPosts.slice(0, 6).map((post) => {
              const hasCover = !isMissingFeedCoverImage(post.coverImage);
              return (
                <Link
                  key={post.id}
                  href={`/feed/${post.slug}`}
                  className="w-[70vw] max-w-[240px] shrink-0 overflow-hidden rounded-xl border border-border bg-card"
                >
                  {hasCover ? (
                    <div className="relative h-28">
                      <FeedCoverImage
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="240px"
                      />
                    </div>
                  ) : (
                    <div className="h-10 bg-muted/50" aria-hidden />
                  )}
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
                      {post.title}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div ref={sentinelRef} className="flex justify-center py-6">
        {loading && (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Yükleniyor…
          </span>
        )}
      </div>
    </div>
  );
}
