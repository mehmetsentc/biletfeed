'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ImageOff, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedCoverImage } from '@/components/feed/feed-cover-image';
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
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchRemaining, setBatchRemaining] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async (missingImage: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/feed${missingImage ? '?missingImage=1' : ''}`);
      const data = (await res.json()) as {
        stats: FeedStats;
        posts: AdminPost[];
        queue: EditorialQueueItem[];
      };
      setStats(data.stats);
      setPosts(data.posts);
      setQueue(data.queue);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(showMissingOnly);
  }, [load, showMissingOnly]);

  async function publishPost(postId: string) {
    const post = posts.find((p) => p.id === postId);
    if (post && isMissingFeedCoverImage(post.coverImage)) {
      setActionError('Görsel eksik — yayınlamak için önce kapak görseli ekleyin.');
      return;
    }
    setActionId(postId);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setActionError(data.error ?? 'Yayınlanamadı');
        return;
      }
      await load(showMissingOnly);
    } finally {
      setActionId(null);
    }
  }

  async function deletePost(postId: string) {
    if (!confirm('Bu haberi silmek istediğinize emin misiniz?')) return;
    setActionId(postId);
    try {
      await fetch(`/api/admin/feed/${postId}`, { method: 'DELETE' });
      await load(showMissingOnly);
    } finally {
      setActionId(null);
    }
  }

  function toggleSelect(postId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === posts.length ? new Set() : new Set(posts.map((p) => p.id))));
  }

  async function bulkDeleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size} haberi silmek istediğinize emin misiniz?`)) return;
    setBulkDeleting(true);
    try {
      await fetch('/api/admin/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk-delete', ids: Array.from(selectedIds) })
      });
      await load(showMissingOnly);
    } finally {
      setBulkDeleting(false);
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
      await load(showMissingOnly);
    } finally {
      setActionId(null);
    }
  }

  async function processQueueBatch() {
    setBatchProcessing(true);
    try {
      // 531 bekleyen gibi büyük bir birikimi tek istekte işlemek zaman aşımına
      // uğrayabilir — 10'arlı gruplar halinde, kalan sıfır olana kadar işler.
      let remaining = Infinity;
      let guard = 0;
      while (remaining > 0 && guard < 200) {
        const res = await fetch('/api/admin/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'process-batch', batchSize: 10 })
        });
        const data = (await res.json()) as { remaining?: number };
        remaining = data.remaining ?? 0;
        setBatchRemaining(remaining);
        guard += 1;
      }
    } finally {
      setBatchProcessing(false);
      setBatchRemaining(null);
      await load(showMissingOnly);
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

      {actionError && (
        <div className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {actionError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Yayında', value: stats?.published ?? 0 },
          { label: 'İncelemede', value: stats?.inReview ?? 0 },
          { label: 'AI Kuyruğu', value: stats?.queuePending ?? 0 },
          { label: 'Toplam Görüntülenme', value: stats?.totalViews ?? 0 },
          { label: 'Görsel Eksik', value: stats?.missingImages ?? 0, warn: true, clickable: true }
        ].map((item) => (
          <Card
            key={item.label}
            role={item.clickable ? 'button' : undefined}
            tabIndex={item.clickable ? 0 : undefined}
            onClick={item.clickable ? () => setShowMissingOnly((v) => !v) : undefined}
            className={cn(
              item.warn && (item.value ?? 0) > 0 && 'border-amber-500/50',
              item.clickable && 'cursor-pointer transition hover:border-amber-500',
              item.clickable && showMissingOnly && 'ring-2 ring-amber-500'
            )}
          >
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">BiletFeed AI Editor — Kuyruk</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {(stats?.queuePending ?? 0).toLocaleString('tr-TR')} öğe bekliyor · en eski bekleyenler önce listelenir
            </p>
          </div>
          {(stats?.queuePending ?? 0) > 0 && (
            <Button size="sm" disabled={batchProcessing} onClick={() => void processQueueBatch()}>
              {batchProcessing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  İşleniyor{batchRemaining !== null ? ` — ${batchRemaining.toLocaleString('tr-TR')} kaldı` : '…'}
                </>
              ) : (
                'Kuyruğu Toplu İşle'
              )}
            </Button>
          )}
        </div>
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">İçerikler</h2>
          <div className="flex flex-wrap items-center gap-2">
            {showMissingOnly && (
              <button
                type="button"
                onClick={() => setShowMissingOnly(false)}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              >
                <ImageOff className="size-3.5" />
                Sadece görseli eksik olanlar gösteriliyor
                <X className="size-3.5" />
              </button>
            )}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/5 py-1 pl-3 pr-1">
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                  {selectedIds.size} seçili
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={bulkDeleting}
                  onClick={() => void bulkDeleteSelected()}
                >
                  {bulkDeleting ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1.5 size-3.5" />
                  )}
                  Seçilenleri Sil
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
        {posts.length === 0 && (
          <p className="mb-4 text-sm text-muted-foreground">
            {showMissingOnly ? 'Görseli eksik haber yok.' : 'Henüz haber yok.'}
          </p>
        )}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={posts.length > 0 && selectedIds.size === posts.length}
                    onChange={toggleSelectAll}
                    aria-label="Tümünü seç"
                    className="size-4 rounded border-border"
                  />
                </th>
                <th className="w-16 px-4 py-3 font-semibold">Görsel</th>
                <th className="px-4 py-3 font-semibold">Başlık</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold">Görüntülenme</th>
                <th className="px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className={cn(
                    'border-b border-border last:border-0',
                    selectedIds.has(post.id) && 'bg-red-500/5'
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      aria-label={`${post.title} seç`}
                      className="size-4 rounded border-border"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {isMissingFeedCoverImage(post.coverImage) ? (
                        <div className="flex size-full items-center justify-center">
                          <ImageOff className="size-4 text-muted-foreground" />
                        </div>
                      ) : (
                        <FeedCoverImage
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{post.title}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">{post.contentType}</p>
                      {isMissingFeedCoverImage(post.coverImage) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          <ImageOff className="size-3" />
                          Görsel eksik
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
                          disabled={
                            actionId === post.id || isMissingFeedCoverImage(post.coverImage)
                          }
                          title={
                            isMissingFeedCoverImage(post.coverImage)
                              ? 'Kapak görseli olmadan yayınlanamaz'
                              : undefined
                          }
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
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionId === post.id}
                        onClick={() => void deletePost(post.id)}
                        className="border-red-500/40 text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="mr-1 size-3.5" />
                        Sil
                      </Button>
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
