import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation, guardAdminRead } from '@/lib/auth/guard-admin-api';
import {
  getFeedAdminStats,
  listAdminFeedPosts,
  publishFeedPost,
  createManualAdminFeedPost
} from '@/lib/services/feed';
import {
  listEditorialQueue,
  processEditorialQueueItem,
  runEditorialPipeline
} from '@/lib/services/feed-editorial';
import { fetchOgImage } from '@/lib/feed/discovery/og-image';
import { normalizeCoverImageUrl } from '@/lib/images/normalize-remote-image';
import { FeedPostType, FeedPostStatus } from '@prisma/client';

const createSchema = z.object({
  action: z.literal('create'),
  title: z.string().min(3).max(300),
  headline: z.string().max(300).optional(),
  summary: z.string().min(10).max(500),
  content: z.string().min(20),
  contentType: z.nativeEnum(FeedPostType),
  coverImage: z.string().url(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  feedCategoryId: z.string().uuid().nullable().optional(),
  status: z.nativeEnum(FeedPostStatus).optional(),
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
    .optional()
});

export async function GET(request: NextRequest) {
  const guard = await guardAdminRead('feed.view');
  if ('error' in guard) return guard.error;

  const status = request.nextUrl.searchParams.get('status') ?? undefined;
  const [stats, posts, queue] = await Promise.all([
    getFeedAdminStats(),
    listAdminFeedPosts(status as never),
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
      return NextResponse.json({ error: 'Geçersiz veri', details: parsed.error.flatten() }, { status: 400 });
    }
    const { action: _a, ...payload } = parsed.data;
    const normalizedCover = await normalizeCoverImageUrl(payload.coverImage);
    const post = await createManualAdminFeedPost({
      ...payload,
      coverImage: normalizedCover ?? payload.coverImage
    });
    return NextResponse.json({ success: true, id: post.id, slug: post.slug });
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

  if (action === 'fix-images') {
    // Logo veya harici kapak görsellerini og:image + WebP dönüşümü ile düzelt
    const { prisma } = await import('@/lib/db/prisma');
    const batchSize = Math.min(Number((json as { batchSize?: number }).batchSize ?? 20), 50);

    const posts = await prisma.feedPost.findMany({
      where: {
        deletedAt: null,
        OR: [
          { coverImage: { contains: 'brand/logo' } },
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
      orderBy: { publishedAt: 'desc' }
    });

    let updated = 0;
    const errors: string[] = [];
    for (const post of posts) {
      try {
        const raw =
          post.coverImage.includes('brand/logo') && post.sourceUrl
            ? await fetchOgImage(post.sourceUrl)
            : post.coverImage;

        if (!raw) continue;

        const normalized = await normalizeCoverImageUrl(raw, post.sourceUrl ?? undefined);
        if (normalized && normalized !== post.coverImage) {
          await prisma.feedPost.update({ where: { id: post.id }, data: { coverImage: normalized } });
          updated += 1;
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    return NextResponse.json({ success: true, total: posts.length, updated, errors });
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

  await publishFeedPost(parsed.data.postId);
  return NextResponse.json({ success: true });
}
