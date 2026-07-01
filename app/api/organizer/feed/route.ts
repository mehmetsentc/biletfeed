import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { createFeedPostFromDraft } from '@/lib/services/feed';
import { getDefaultOgImage } from '@/lib/seo/constants';

const createSchema = z.object({
  title: z.string().min(5).max(200),
  summary: z.string().min(20).max(500),
  content: z.string().min(50).max(20000),
  eventId: z.string().uuid().optional(),
  coverImage: z.string().url().optional()
});

/** Organizatör duyuruları — moderasyon sonrası Feed'de yayınlanır */
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  const post = await createFeedPostFromDraft({
    title: parsed.data.title,
    summary: parsed.data.summary,
    content: parsed.data.content,
    contentType: 'organizer_update',
    coverImage: parsed.data.coverImage ?? getDefaultOgImage(),
    organizerId: ctx.organizer.id,
    eventId: parsed.data.eventId,
    status: 'review'
  });

  return NextResponse.json({ success: true, post });
}
