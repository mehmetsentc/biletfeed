import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation, guardAdminRead } from '@/lib/auth/guard-admin-api';
import {
  getFeedAdminStats,
  listAdminFeedPosts,
  publishFeedPost
} from '@/lib/services/feed';
import {
  listEditorialQueue,
  processEditorialQueueItem,
  runEditorialPipeline
} from '@/lib/services/feed-editorial';

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
