import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FeedPostType, FeedPostStatus } from '@prisma/client';
import { guardAdminMutation, guardAdminRead } from '@/lib/auth/guard-admin-api';
import { getAdminFeedPostById, updateAdminFeedPost } from '@/lib/services/feed';
import { normalizeCoverImageUrl } from '@/lib/images/normalize-remote-image';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

const mediaSchema = z.object({
  type: z.enum(['image', 'video', 'embed', 'reel']),
  url: z.string().url(),
  thumbnail: z.string().url().optional().nullable(),
  alt: z.string().max(200).optional().nullable(),
  caption: z.string().max(500).optional().nullable()
});

const updateSchema = z.object({
  title: z.string().min(3).max(300).optional(),
  headline: z.string().max(300).optional().nullable(),
  summary: z.string().min(10).max(500).optional(),
  content: z.string().min(20).optional(),
  contentType: z.nativeEnum(FeedPostType).optional(),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  feedCategoryId: z.string().uuid().nullable().optional(),
  status: z.nativeEnum(FeedPostStatus).optional(),
  media: z.array(mediaSchema).optional()
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminRead('feed.view');
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const post = await getAdminFeedPostById(id);
  if (!post) {
    return NextResponse.json({ error: 'Haber bulunamadı' }, { status: 404 });
  }
  return NextResponse.json({ post });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'feed.manage');
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = { ...parsed.data };
    if (data.coverImage) {
      const normalized = await normalizeCoverImageUrl(data.coverImage);
      if (normalized) data.coverImage = normalized;
    }
    const result = await updateAdminFeedPost(id, data);
    return NextResponse.json({ success: true, slug: result.slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Güncellenemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'feed.manage');
  if ('error' in guard) return guard.error;

  const { id } = await params;
  await ensureDbConnection();
  await prisma.feedPost.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'archived' }
  });
  return NextResponse.json({ success: true });
}
