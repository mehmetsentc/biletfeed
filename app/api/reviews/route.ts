import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { ensureDbConnection } from '@/lib/db/prisma';
import {
  createUserReview,
  resolveEventIdForReview
} from '@/lib/services/user-reviews';

const bodySchema = z.object({
  eventId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(1000)
});

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
    }

    const session = await verifySessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    await ensureDbConnection();

    const eventId = await resolveEventIdForReview(
      session.uid,
      parsed.data.eventId
    );
    if (!eventId) {
      return NextResponse.json(
        { error: 'Etkinlik bulunamadı' },
        { status: 404 }
      );
    }

    const review = await createUserReview(session.uid, {
      eventId,
      rating: parsed.data.rating,
      comment: parsed.data.comment
    });

    return NextResponse.json({
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        event: {
          title: review.event.title,
          slug: review.event.slug,
          coverImage: review.event.coverImage,
          organizerName: review.event.organizer.name,
          organizerSlug: review.event.organizer.slug
        }
      }
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Değerlendirme kaydedilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
