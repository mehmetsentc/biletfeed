import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminSession, adminUnauthorized } from '@/lib/auth/admin-api';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  getFeedAdminStats,
  listAdminFeedPosts,
  publishFeedPost
} from '@/lib/services/feed';
import { listEditorialQueue, processEditorialQueueItem } from '@/lib/services/feed-editorial';

export async function GET(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return adminUnauthorized();

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
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }
  const session = await requireAdminSession();
  if (!session) return adminUnauthorized();

  const json = await request.json();
  const action = (json as { action?: string }).action;

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
