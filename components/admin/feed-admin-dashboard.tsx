'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EditorialQueueItem } from '@/lib/feed/types';

type FeedStats = {
  published: number;
  inReview: number;
  queuePending: number;
  totalViews: number;
};

type AdminPost = {
  id: string;
  slug: string;
  title: string;
  status: string;
  contentType: string;
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Yayında', value: stats?.published ?? 0 },
          { label: 'İncelemede', value: stats?.inReview ?? 0 },
          { label: 'AI Kuyruğu', value: stats?.queuePending ?? 0 },
          { label: 'Toplam Görüntülenme', value: stats?.totalViews ?? 0 }
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{item.value.toLocaleString('tr-TR')}</p>
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
                    <p className="text-xs text-muted-foreground">{post.contentType}</p>
                  </td>
                  <td className="px-4 py-3">{post.status}</td>
                  <td className="px-4 py-3">{post.viewCount}</td>
                  <td className="px-4 py-3">
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
                      <a href={`/feed/${post.slug}`} className="text-primary underline" target="_blank" rel="noreferrer">
                        Görüntüle
                      </a>
                    )}
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
