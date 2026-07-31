'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FeedCoverBackground } from '@/components/feed/feed-cover-image';
import { Loader2 } from 'lucide-react';
import { FeedBillboardHero } from '@/components/feed/feed-billboard-hero';
import { FeedTimelineCard } from '@/components/feed/feed-timeline-card';
import { FeedMagazineCard } from '@/components/feed/feed-magazine-card';
import { FeedRecentSidebar } from '@/components/feed/feed-recent-sidebar';
import { Button } from '@/components/ui/button';
import { groupFeedPostsByDate } from '@/lib/feed/format-date';
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
  // İki ayrı sentinel: mobil ve masaüstü düzenleri aynı anda DOM'da
  // (CSS ile gizleniyor), tek ref paylaşımı yanlış düğüme bağlanabilir.
  const mobileSentinelRef = useRef<HTMLDivElement | null>(null);
  const desktopSentinelRef = useRef<HTMLDivElement | null>(null);

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

  // Aşağı kaydırıldıkça otomatik yeni içerik yükle. Gizli (display:none)
  // düğüm hiçbir zaman kesişmediği için sadece görünür olan tetiklenir.
  useEffect(() => {
    if (!cursor) return;
    const nodes = [mobileSentinelRef.current, desktopSentinelRef.current].filter(
      (n): n is HTMLDivElement => n !== null
    );
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: '400px' }
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
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

  // Hero her zaman en yeni haber olsun (trend skoruna göre değil) — eski ama
  // popüler bir haberin sürekli en üstte takılı kalmasını engeller.
  const heroPost = posts[0]!;
  const heroId = heroPost.id;
  const timelinePosts = posts.filter((p) => p.id !== heroId);
  const dateGroups = groupFeedPostsByDate(timelinePosts);
  const flatTimeline = dateGroups.flatMap((g) => g.posts);
  const trendingStrip = trending.filter((p) => p.id !== heroId).slice(0, 4);

  // Masaüstü dergi düzeni: 2 büyük + 3 orta kart, ardından ana liste + kenar çubuğu
  const desktopHero = posts.slice(0, 2);
  const desktopSecondary = posts.slice(2, 5);
  const desktopMain = posts.slice(5);
  const desktopSidebar = (trending.length > 0 ? trending : posts).slice(0, 6);

  const loadingIndicator = loading && (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Yükleniyor…
    </span>
  );

  return (
    <>
      {/* ── Mobile: billboard + timeline ── */}
      <div className="md:hidden">
        <section className="mb-8">
          <FeedBillboardHero post={heroPost} />
        </section>

        {trendingStrip.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--bf-accent-ink)]">
              Trend Hikâyeler
            </h2>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {trendingStrip.map((post) => (
                <Link
                  key={post.id}
                  href={`/feed/${post.slug}`}
                  className="w-[72vw] max-w-[280px] shrink-0 overflow-hidden rounded-xl border border-border bg-card"
                >
                  <FeedCoverBackground
                    src={post.coverImage}
                    className="h-28 bg-cover bg-center"
                  />
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
                      {post.title}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{post.readingTimeMinutes} dk okuma</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--bf-accent-ink)]">Gündem</p>
              <h2 className="mt-1 text-xl font-extrabold text-foreground">Feed</h2>
            </div>
            <span className="text-xs text-muted-foreground">{flatTimeline.length + 1} hikâye</span>
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

        <div ref={mobileSentinelRef} className="flex justify-center py-6">
          {loadingIndicator}
        </div>
      </div>

      {/* ── Desktop: dergi tarzı düzen ── */}
      <div className="hidden space-y-8 md:block">
        {desktopHero.length > 0 && (
          <section className="grid gap-4 lg:grid-cols-2">
            {desktopHero.map((post) => (
              <FeedMagazineCard key={post.id} post={post} size="large" />
            ))}
          </section>
        )}

        {desktopSecondary.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {desktopSecondary.map((post) => (
              <FeedMagazineCard key={post.id} post={post} size="medium" />
            ))}
          </section>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <section className="grid gap-6 sm:grid-cols-2">
            {desktopMain.map((post) => (
              <FeedMagazineCard key={post.id} post={post} size="medium" />
            ))}
          </section>
          <FeedRecentSidebar posts={desktopSidebar} />
        </div>

        <div ref={desktopSentinelRef} className="flex justify-center py-6">
          {loadingIndicator}
        </div>
      </div>
    </>
  );
}
