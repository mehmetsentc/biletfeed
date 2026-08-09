import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation, guardAdminRead } from '@/lib/auth/guard-admin-api';
import {
  getFeedAdminStats,
  listAdminFeedPosts,
  publishFeedPost,
  createManualAdminFeedPost,
  bulkDeleteFeedPosts,
  bulkUnfeatureFeedPosts,
  pullCoverFromSource
} from '@/lib/services/feed';
import {
  listEditorialQueue,
  processEditorialQueueItem,
  runEditorialPipeline
} from '@/lib/services/feed-editorial';
import { fetchOgImage } from '@/lib/feed/discovery/og-image';
import { isMissingFeedCoverImage } from '@/lib/feed/constants';
import { normalizeCoverImageUrl } from '@/lib/images/normalize-remote-image';
import { FeedPostType, FeedPostStatus } from '@prisma/client';
import { zodErrorMessage } from '@/lib/api/zod-validation';

const createSchema = z.object({
  action: z.literal('create'),
  title: z.string().min(3).max(300),
  headline: z.string().max(300).optional(),
  summary: z.string().min(10).max(500),
  content: z.string().min(20),
  contentType: z.nativeEnum(FeedPostType),
  /** Taslak/incelemede boş kapak kabul; yayın/öne çıkarma serviste engellenir. */
  coverImage: z.union([z.string().url(), z.literal('')]),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  feedCategoryId: z.string().uuid().nullable().optional(),
  status: z.nativeEnum(FeedPostStatus).optional(),
  // SEO alanları görüntüsel/meta amaçlıdır — sınırı aşan değer reddedilmek
  // yerine sessizce kırpılır.
  seo: z
    .object({
      title: z
        .string()
        .optional()
        .transform((v) => v?.slice(0, 70)),
      description: z
        .string()
        .optional()
        .transform((v) => v?.slice(0, 200)),
      keywords: z.array(z.string().max(40)).max(12).optional()
    })
    .optional(),
  media: z
    .array(
      z.object({
        type: z.enum(['image', 'video', 'embed', 'reel']),
        url: z.string().url(),
        thumbnail: z.string().url().optional().nullable(),
        alt: z.string().max(200).optional().nullable(),
        caption: z.string().max(500).optional().nullable()
      })
    )
    .optional(),
  aiProvider: z.string().max(40).optional(),
  aiModel: z.string().max(80).optional(),
  aiMetadata: z.record(z.string(), z.unknown()).optional(),
  readingTimeMinutes: z.number().int().min(1).max(60).optional()
});

export async function GET(request: NextRequest) {
  const guard = await guardAdminRead('feed.view');
  if ('error' in guard) return guard.error;

  const status = request.nextUrl.searchParams.get('status') ?? undefined;
  const missingImage = request.nextUrl.searchParams.get('missingImage') === '1';
  const [stats, posts, queue] = await Promise.all([
    getFeedAdminStats(),
    listAdminFeedPosts(status as never, missingImage),
    listEditorialQueue(30)
  ]);

  return NextResponse.json({ stats, posts, queue });
}

const publishSchema = z.object({ postId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const guard = await guardAdminMutation(request, 'feed.manage');
  if ('error' in guard) return guard.error;

  const json = await request.json();
  const action = (json as { action?: string }).action;

  if (action === 'create') {
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodErrorMessage(parsed.error), details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { action: _a, ...payload } = parsed.data;
    const normalizedCover =
      payload.coverImage && !isMissingFeedCoverImage(payload.coverImage)
        ? await normalizeCoverImageUrl(payload.coverImage)
        : null;
    try {
      const post = await createManualAdminFeedPost({
        ...payload,
        coverImage: normalizedCover ?? (isMissingFeedCoverImage(payload.coverImage) ? '' : payload.coverImage)
      });
      return NextResponse.json({ success: true, id: post.id, slug: post.slug });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Oluşturulamadı';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (action === 'discover') {
    // Tavily + RSS keşfi başlat (harici + dahili)
    const result = await runEditorialPipeline(5, true);
    return NextResponse.json({ success: true, ...result });
  }

  if (action === 'process-batch') {
    // Bekleyen öğeleri toplu işle (varsayılan 5 adet — timeout önlemek için)
    const batchSize = Number((json as { batchSize?: number }).batchSize ?? 5);
    const pending = await (await import('@/lib/db/prisma')).prisma.feedEditorialQueue.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: Math.min(batchSize, 10)
    });
    const errors: string[] = [];
    let processed = 0;
    for (const item of pending) {
      try {
        await processEditorialQueueItem(item.id);
        processed += 1;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }
    const remaining = await (await import('@/lib/db/prisma')).prisma.feedEditorialQueue.count({
      where: { status: 'pending' }
    });
    return NextResponse.json({ success: true, processed, errors, remaining });
  }

  if (action === 'reset-failed') {
    // failed durumdaki queue öğelerini tekrar pending'e al
    const { prisma } = await import('@/lib/db/prisma');
    const result = await prisma.feedEditorialQueue.updateMany({
      where: { status: 'failed' },
      data: { status: 'pending', errorMessage: null, processedAt: null, stage: 'discovery' }
    });
    return NextResponse.json({ success: true, reset: result.count });
  }

  if (action === 'fetch-cover') {
    const postId = (json as { postId?: string }).postId;
    if (!postId || !z.string().uuid().safeParse(postId).success) {
      return NextResponse.json({ error: 'postId gerekli' }, { status: 400 });
    }
    const result = await pullCoverFromSource(postId);
    if (!result.ok) {
      return NextResponse.json({ error: result.message, fetched: false }, { status: 422 });
    }
    return NextResponse.json({
      success: true,
      fetched: true,
      coverImage: result.coverImage,
      message: result.message
    });
  }

  if (action === 'fix-images') {
    // Kapaksız + logo + harici kapakları og:image + WebP ile düzelt
    const { prisma } = await import('@/lib/db/prisma');
    const batchSize = Math.min(Number((json as { batchSize?: number }).batchSize ?? 20), 50);

    const posts = await prisma.feedPost.findMany({
      where: {
        deletedAt: null,
        OR: [
          { coverImage: '' },
          { coverImage: { contains: 'brand/logo' } },
          { coverImage: { contains: 'og-default' } },
          {
            AND: [
              { coverImage: { startsWith: 'http' } },
              { NOT: { coverImage: { contains: 'firebasestorage.googleapis.com' } } },
              { NOT: { coverImage: { contains: 'storage.googleapis.com' } } }
            ]
          }
        ]
      },
      select: { id: true, sourceUrl: true, coverImage: true },
      take: batchSize,
      orderBy: { updatedAt: 'desc' }
    });

    let updated = 0;
    const errors: string[] = [];
    let skippedNoOg = 0;
    for (const post of posts) {
      try {
        const needsSourceOg =
          isMissingFeedCoverImage(post.coverImage) || post.coverImage.includes('brand/logo');
        const raw =
          needsSourceOg && post.sourceUrl
            ? await fetchOgImage(post.sourceUrl)
            : isMissingFeedCoverImage(post.coverImage)
              ? null
              : post.coverImage;

        if (!raw) {
          if (needsSourceOg) skippedNoOg += 1;
          continue;
        }

        const normalized = await normalizeCoverImageUrl(raw, post.sourceUrl ?? undefined);
        if (normalized && normalized !== post.coverImage && !isMissingFeedCoverImage(normalized)) {
          await prisma.feedPost.update({ where: { id: post.id }, data: { coverImage: normalized } });
          updated += 1;
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    return NextResponse.json({
      success: true,
      total: posts.length,
      updated,
      skippedNoOg,
      errors
    });
  }

  if (action === 'bulk-delete') {
    const idsSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(200) });
    const parsedIds = idsSchema.safeParse(json);
    if (!parsedIds.success) {
      return NextResponse.json(
        { error: zodErrorMessage(parsedIds.error), details: parsedIds.error.flatten() },
        { status: 400 }
      );
    }
    const deleted = await bulkDeleteFeedPosts(parsedIds.data.ids);
    return NextResponse.json({ success: true, deleted });
  }

  if (action === 'bulk-unfeature') {
    const idsSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(200) });
    const parsedIds = idsSchema.safeParse(json);
    if (!parsedIds.success) {
      return NextResponse.json(
        { error: zodErrorMessage(parsedIds.error), details: parsedIds.error.flatten() },
        { status: 400 }
      );
    }
    const updated = await bulkUnfeatureFeedPosts(parsedIds.data.ids);
    return NextResponse.json({ success: true, updated });
  }

  if (action === 'process-queue') {
    const queueId = (json as { queueId?: string }).queueId;
    if (!queueId) {
      return NextResponse.json({ error: 'queueId gerekli' }, { status: 400 });
    }
    const result = await processEditorialQueueItem(queueId);
    return NextResponse.json({ success: true, ...result });
  }

  const parsed = publishSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    await publishFeedPost(parsed.data.postId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yayınlanamadı';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
