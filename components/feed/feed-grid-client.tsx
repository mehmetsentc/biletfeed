'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { FeedPostCardView } from '@/components/feed/feed-post-card';
import { Button } from '@/components/ui/button';
import type { FeedPostCard } from '@/lib/feed/types';

export function FeedGridClient({
  initialPosts,
  initialCursor
}: {
  initialPosts: FeedPostCard[];
  initialCursor: string | null;
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
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="text-lg font-semibold text-foreground">Feed henüz boş</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Konser ve festival haberleri yakında burada olacak. Şimdilik etkinlikleri
          keşfedin.
        </p>
        <Button asChild className="mt-6">
          <Link href="/etkinlikler">Etkinlikleri Keşfet</Link>
        </Button>
      </div>
    );
  }

  const [featured, ...rest] = posts;

  return (
    <div className="space-y-8">
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
  );
}
