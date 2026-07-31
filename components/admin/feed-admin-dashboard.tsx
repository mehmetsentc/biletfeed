'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ImageOff, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EditorialQueueItem } from '@/lib/feed/types';
import { isMissingFeedCoverImage } from '@/lib/feed/constants';
import { adminHref, getSiteUrl } from '@/lib/config/domain';
import { cn } from '@/lib/utils';

type FeedStats = {
  published: number;
  inReview: number;
  queuePending: number;
  totalViews: number;
  missingImages: number;
};

type AdminPost = {
  id: string;
  slug: string;
  title: string;
  status: string;
  contentType: string;
  coverImage: string;
  viewCount: number;
  likeCount: number;
  publishedAt: string | null;
  createdAt: string;
  isFeatured: boolean;
};

export function FeedAdminDashboard() {
  const [stats, setStats] = useState<FeedStats | null>(null);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [queue, setQueue] = useState<EditorialQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/feed');
      const data = (await res.json()) as {
        stats: FeedStats;
        posts: AdminPost[];
        queue: EditorialQueueItem[];
      };
      setStats(data.stats);
      setPosts(data.posts);
      setQueue(data.queue);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function publishPost(postId: string) {
    setActionId(postId);
    try {
      await fetch('/api/admin/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });
      await load();
    } finally {
      setActionId(null);
    }
  }

  async function processQueue(queueId: string) {
    setActionId(queueId);
    try {
      await fetch('/api/admin/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process-queue', queueId })
      });
      await load();
    } finally {
      setActionId(null);
    }
  }

  if (loading && !stats) {
    return <p className="text-sm text-muted-foreground">Feed yükleniyor…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Manuel haber oluşturun veya mevcut içerikleri düzenleyin
        </p>
        <Button asChild>
          <Link href={adminHref('/feed/yeni')}>
            <Plus className="mr-2 size-4" />
            Yeni Haber
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Yayında', value: stats?.published ?? 0 },
          { label: 'İncelemede', value: stats?.inReview ?? 0 },
          { label: 'AI Kuyruğu', value: stats?.queuePending ?? 0 },
          { label: 'Toplam Görüntülenme', value: stats?.totalViews ?? 0 },
          { label: 'Görsel Eksik', value: stats?.missingImages ?? 0, warn: true }
        ].map((item) => (
          <Card key={item.label} className={cn(item.warn && (item.value ?? 0) > 0 && 'border-amber-500/50')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  'text-3xl font-bold',
                  item.warn && (item.value ?? 0) > 0 && 'text-amber-600 dark:text-amber-400'
                )}
              >
                {item.value.toLocaleString('tr-TR')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold">BiletFeed AI Editor — Kuyruk</h2>
        <div className="space-y-3">
          {queue.length === 0 && (
            <p className="text-sm text-muted-foreground">Bekleyen keşif öğesi yok.</p>
          )}
          {queue.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{item.sourceTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.sourceName ?? 'Kaynak'} · {item.stage}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.sourceSnippet}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-center text-xs font-medium">{item.status}</span>
                  {item.status === 'pending' && (
                    <Button
                      size="sm"
                      disabled={actionId === item.id}
                      onClick={() => void processQueue(item.id)}
                    >
                      AI İşle
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">İçerikler</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-semibold">Başlık</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold">Görüntülenme</th>
                <th className="px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{post.title}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">{post.contentType}</p>
                      {isMissingFeedCoverImage(post.coverImage) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          <ImageOff className="size-3" />
                          Görsel yok
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{post.status}</td>
                  <td className="px-4 py-3">{post.viewCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={adminHref(`/feed/${post.id}`)}>
                          <Pencil className="mr-1 size-3.5" />
                          Düzenle
                        </Link>
                      </Button>
                      {post.status === 'review' && (
                        <Button
                          size="sm"
                          disabled={actionId === post.id}
                          onClick={() => void publishPost(post.id)}
                        >
                          Yayınla
                        </Button>
                      )}
                      {post.status === 'published' && (
                        <a
                          href={getSiteUrl(`/feed/${post.slug}`)}
                          className="inline-flex h-8 items-center text-sm text-[var(--bf-accent-ink)] underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Görüntüle
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
