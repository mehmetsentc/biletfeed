import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import {
  analyzeDiscoveryItem,
  hashDiscoveryContent,
  rewriteDiscoveryItem,
  type DiscoveredItem
} from '@/lib/feed/ai-editor';
import { createFeedPostFromDraft } from '@/lib/services/feed';
import type { EditorialQueueItem } from '@/lib/feed/types';
import { getDefaultOgImage } from '@/lib/seo/constants';
import { fetchOgImage } from '@/lib/feed/discovery/og-image';
import { normalizeCoverImageUrl } from '@/lib/images/normalize-remote-image';
import { discoverViaTavily } from '@/lib/feed/discovery/tavily';
import { discoverViaRss } from '@/lib/feed/discovery/rss';
import { TAVILY_QUERIES, RSS_SOURCES } from '@/lib/feed/discovery/sources';

export async function enqueueDiscoveryItem(item: DiscoveredItem): Promise<{ id: string; duplicate: boolean }> {
  await ensureDbConnection();
  const contentHash = hashDiscoveryContent(item);

  const existing = await prisma.feedEditorialQueue.findUnique({
    where: { contentHash }
  });
  if (existing) {
    return { id: existing.id, duplicate: true };
  }

  const row = await prisma.feedEditorialQueue.create({
    data: {
      sourceUrl: item.sourceUrl,
      sourceTitle: item.sourceTitle,
      sourceSnippet: item.sourceSnippet,
      sourceName: item.sourceName,
      contentHash,
      status: 'pending',
      stage: 'discovery'
    }
  });
  return { id: row.id, duplicate: false };
}

export async function processEditorialQueueItem(queueId: string): Promise<{ postId?: string; skipped?: string }> {
  await ensureDbConnection();
  const item = await prisma.feedEditorialQueue.findUnique({ where: { id: queueId } });
  if (!item || item.status !== 'pending') {
    return { skipped: 'Öğe bulunamadı veya işlenmiş' };
  }

  await prisma.feedEditorialQueue.update({
    where: { id: queueId },
    data: { status: 'processing', stage: 'duplicate_check' }
  });

  try {
    const discovery: DiscoveredItem = {
      sourceUrl: item.sourceUrl,
      sourceTitle: item.sourceTitle,
      sourceSnippet: item.sourceSnippet ?? undefined,
      sourceName: item.sourceName ?? undefined
    };

    const analysis = await analyzeDiscoveryItem(discovery);
    if (!analysis.isRelevant) {
      await prisma.feedEditorialQueue.update({
        where: { id: queueId },
        data: {
          status: 'rejected',
          stage: 'analysis',
          aiAnalysis: analysis,
          processedAt: new Date(),
          errorMessage: analysis.reason
        }
      });
      return { skipped: analysis.reason };
    }

    if (analysis.isDuplicate) {
      await prisma.feedEditorialQueue.update({
        where: { id: queueId },
        data: { status: 'duplicate', stage: 'duplicate_check', processedAt: new Date(), aiAnalysis: analysis }
      });
      return { skipped: 'Yinelenen içerik' };
    }

    await prisma.feedEditorialQueue.update({
      where: { id: queueId },
      data: { stage: 'rewrite', aiAnalysis: analysis }
    });

    const draft = await rewriteDiscoveryItem(discovery, analysis.contentType);

    await prisma.feedEditorialQueue.update({
      where: { id: queueId },
      data: { stage: 'seo' }
    });

    // Kaynak URL'den og:image çek → WebP/JPEG olarak Firebase'e kaydet
    const rawCover = await fetchOgImage(item.sourceUrl);
    const normalizedCover = rawCover
      ? await normalizeCoverImageUrl(rawCover, item.sourceUrl)
      : null;
    const coverImage = normalizedCover ?? getDefaultOgImage();

    const post = await createFeedPostFromDraft({
      title: draft.title,
      headline: draft.headline,
      summary: draft.summary,
      content: draft.content,
      excerpt: draft.excerpt,
      contentType: draft.contentType,
      coverImage,
      tags: draft.tags,
      sourceUrl: item.sourceUrl,
      sourceName: item.sourceName ?? undefined,
      sourceAttribution: item.sourceName ? `Kaynak: ${item.sourceName}` : undefined,
      seo: { title: draft.seoTitle, description: draft.seoDescription },
      readingTimeMinutes: draft.readingTimeMinutes,
      artistName: draft.artistName,
      status: 'review'
    });

    await prisma.feedEditorialQueue.update({
      where: { id: queueId },
      data: {
        status: 'completed',
        stage: 'review',
        postId: post.id,
        processedAt: new Date()
      }
    });

    return { postId: post.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'İşlem başarısız';
    await prisma.feedEditorialQueue.update({
      where: { id: queueId },
      data: { status: 'failed', errorMessage: message, processedAt: new Date() }
    });
    throw err;
  }
}

export async function listEditorialQueue(limit = 50): Promise<EditorialQueueItem[]> {
  await ensureDbConnection();
  const rows = await prisma.feedEditorialQueue.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      post: { select: { slug: true, title: true, status: true } }
    }
  });

  return rows.map((row) => ({
    id: row.id,
    sourceUrl: row.sourceUrl,
    sourceTitle: row.sourceTitle,
    sourceSnippet: row.sourceSnippet,
    sourceName: row.sourceName,
    status: row.status,
    stage: row.stage,
    postId: row.postId,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt.toISOString(),
    post: row.post
  }));
}

export async function discoverFromPublishedEvents(limit = 5): Promise<number> {
  await ensureDbConnection();
  const events = await prisma.event.findMany({
    where: {
      status: 'published',
      deletedAt: null,
      startDate: { gte: new Date() }
    },
    select: {
      id: true,
      title: true,
      shortDescription: true,
      description: true,
      slug: true,
      coverImage: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  let enqueued = 0;
  for (const event of events) {
    const result = await enqueueDiscoveryItem({
      sourceUrl: `https://biletfeed.com/etkinlik/${event.slug}`,
      sourceTitle: event.title,
      sourceSnippet: event.shortDescription ?? event.description.slice(0, 280),
      sourceName: 'BiletFeed'
    });
    if (!result.duplicate) enqueued += 1;
  }
  return enqueued;
}

/**
 * Tavily + RSS kaynaklarından harici haber keşfi.
 * Bulunan öğeleri editorial kuyruğuna ekler.
 */
export async function discoverFromExternalSources(): Promise<{
  tavilyCount: number;
  rssCount: number;
  enqueued: number;
  errors: string[];
}> {
  const allErrors: string[] = [];

  // Tavily araması
  const tavily = await discoverViaTavily(TAVILY_QUERIES);
  allErrors.push(...tavily.errors);

  // RSS feed'leri
  const rss = await discoverViaRss(RSS_SOURCES);
  allErrors.push(...rss.errors);

  // Tüm öğeleri kuyruğa ekle (duplicate kontrolü enqueueDiscoveryItem içinde)
  const allItems: DiscoveredItem[] = [...tavily.items, ...rss.items];
  let enqueued = 0;
  for (const item of allItems) {
    try {
      const result = await enqueueDiscoveryItem(item);
      if (!result.duplicate) enqueued += 1;
    } catch (err) {
      allErrors.push(`Kuyruk hatası: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    tavilyCount: tavily.items.length,
    rssCount: rss.items.length,
    enqueued,
    errors: allErrors
  };
}

export async function runEditorialPipeline(
  batchSize = 3,
  includeExternal = false
): Promise<{
  discovered: number;
  externalDiscovered?: { tavilyCount: number; rssCount: number; enqueued: number };
  processed: number;
  errors: string[];
}> {
  const errors: string[] = [];

  // Dahili: BiletFeed etkinliklerinden keşif
  const discovered = await discoverFromPublishedEvents(batchSize);

  // Harici: Tavily + RSS (isteğe bağlı — günlük cron'da true gönderilir)
  let externalDiscovered: { tavilyCount: number; rssCount: number; enqueued: number } | undefined;
  if (includeExternal) {
    const ext = await discoverFromExternalSources();
    externalDiscovered = {
      tavilyCount: ext.tavilyCount,
      rssCount: ext.rssCount,
      enqueued: ext.enqueued
    };
    errors.push(...ext.errors);
  }

  // Bekleyen öğeleri işle
  const pending = await prisma.feedEditorialQueue.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
    take: batchSize
  });

  let processed = 0;
  for (const item of pending) {
    try {
      await processEditorialQueueItem(item.id);
      processed += 1;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return { discovered, externalDiscovered, processed, errors };
}
