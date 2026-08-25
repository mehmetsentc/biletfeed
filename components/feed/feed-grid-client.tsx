'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { FeedCoverImage } from '@/components/feed/feed-cover-image';
import { FeedLeadStory } from '@/components/feed/feed-lead-story';
import { FeedFeatureTile } from '@/components/feed/feed-feature-tile';
import { FeedStoryRow } from '@/components/feed/feed-story-row';
import { FeedRecentSidebar } from '@/components/feed/feed-recent-sidebar';
import { FeedSearchInput } from '@/components/feed/feed-search-input';
import { Button } from '@/components/ui/button';
import { isMissingFeedCoverImage } from '@/lib/feed/constants';
import { pickFeaturedRail } from '@/lib/feed/ranking';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const searchSeq = useRef(0);

  const loadMore = useCallback(async () => {
    if (!cursor || loading || isSearchMode) return;
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
  }, [cursor, loading, categorySlug, isSearchMode]);

  useEffect(() => {
    if (isSearchMode) return;
    setPosts(initialPosts);
    setCursor(initialCursor);
  }, [initialPosts, initialCursor, categorySlug, isSearchMode]);

  useEffect(() => {
    // Kategori değişince aramayı sıfırla
    setSearchQuery('');
    setIsSearchMode(false);
    setPosts(initialPosts);
    setCursor(initialCursor);
  }, [categorySlug]); // eslint-disable-line react-hooks/exhaustive-deps -- reset on chip change only

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setIsSearchMode(false);
      setPosts(initialPosts);
      setCursor(initialCursor);
      setSearchLoading(false);
      return;
    }

    const seq = ++searchSeq.current;
    setIsSearchMode(true);
    setSearchLoading(true);
    setCursor(null);

    void (async () => {
      try {
        const params = new URLSearchParams({ q });
        if (categorySlug) params.set('category', categorySlug);
        const res = await fetch(`/api/feed?${params.toString()}`);
        const data = (await res.json()) as { posts: FeedPostCard[] };
        if (seq !== searchSeq.current) return;
        setPosts(data.posts ?? []);
      } finally {
        if (seq === searchSeq.current) setSearchLoading(false);
      }
    })();
  }, [searchQuery, categorySlug, initialPosts, initialCursor]);

  useEffect(() => {
    if (!cursor || isSearchMode) return;
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
  }, [cursor, loadMore, isSearchMode]);

  return (
    <div className="space-y-8 md:space-y-10">
      <FeedSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        loading={searchLoading}
      />

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-lg font-semibold text-foreground">
            {isSearchMode
              ? 'Aramanızla eşleşen haber yok'
              : categorySlug
                ? 'Bu kategoride henüz haber yok'
                : 'Henüz yayınlanmış haber yok'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSearchMode
              ? 'Farklı bir kelime deneyin veya kategori filtresini kaldırın.'
              : categorySlug
                ? 'Konser, festival ve sanatçı gündemi yakında burada olacak.'
                : 'Editöryel ekip yeni hikâyeler yayınladığında burada görünecek.'}
          </p>
          {isSearchMode ? (
            <Button className="mt-6" variant="outline" onClick={() => setSearchQuery('')}>
              Aramayı temizle
            </Button>
          ) : categorySlug ? (
            <Button asChild className="mt-6">
              <Link href="/feed">Tüm gündeme dön</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          {isSearchMode ? (
            <section aria-label="Arama sonuçları">
              <div className="mb-1 flex items-end justify-between gap-3 border-b border-border pb-3">
                <h2 className="text-lg font-extrabold tracking-tight text-foreground md:text-xl">
                  Arama sonuçları
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {posts.length} sonuç
                </span>
              </div>
              <div>
                {posts.map((post) => (
                  <FeedStoryRow key={post.id} post={post} />
                ))}
              </div>
            </section>
          ) : (
            <>
              <section aria-label="Manşet">
                <FeedLeadStory post={posts[0]!} />
              </section>

              {(() => {
                const { featured: secondary, remainder } = pickFeaturedRail(
                  posts.slice(1).filter((p) => !isMissingFeedCoverImage(p.coverImage)),
                  3
                );
                const list = remainder;
                const sidebarPosts = (trending.length > 0 ? trending : posts)
                  .filter((p) => p.id !== posts[0]!.id && !isMissingFeedCoverImage(p.coverImage))
                  .slice(0, 8);

                return (
                  <>
                    {secondary.length > 0 && (
                      <section aria-label="Öne çıkanlar">
                        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          Öne çıkanlar
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3">
                          {secondary.map((post) => (
                            <FeedFeatureTile key={post.id} post={post} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/*
                      md–xl (iPad): ana sütun tam genişlik + altta Trend şeridi.
                      xl+ (masaüstü): sağda sticky Trend.
                      Telefon: yatay Trend şeridi.
                    */}
                    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px] xl:gap-10">
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

                      <div className="hidden xl:block">
                        <div className="sticky top-24">
                          <FeedRecentSidebar posts={sidebarPosts} />
                        </div>
                      </div>
                    </div>

                    {sidebarPosts.length > 0 && (
                      <section className="xl:hidden" aria-label="Trend">
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
                  </>
                );
              })()}
            </>
          )}

          {!isSearchMode ? (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {loading ? (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Daha fazla yükleniyor…
                </span>
              ) : !cursor && posts.length > 0 ? (
                <span className="text-sm text-muted-foreground">Gündemin sonuna geldiniz</span>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
