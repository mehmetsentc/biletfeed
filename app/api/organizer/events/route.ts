import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { createOrganizerEvent } from '@/lib/services/organizer-events';
import { listOrganizerEventsDetailed } from '@/lib/services/organizer-events';

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10000),
  categorySlug: z.string().min(1),
  citySlug: z.string().min(1),
  venueName: z.string().max(200).optional(),
  venueAddress: z.string().max(300).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isFree: z.boolean().default(false),
  price: z.number().min(0).default(0),
  capacity: z.number().int().min(1).max(100000),
  coverImage: z.string().url().optional(),
  status: z.enum(['draft', 'published', 'pending']).optional()
});

export async function GET() {
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const events = await listOrganizerEventsDetailed(ctx.organizer.id);
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    const event = await createOrganizerEvent({
      organizerId: ctx.organizer.id,
      title: parsed.data.title,
      description: parsed.data.description,
      categorySlug: parsed.data.categorySlug,
      citySlug: parsed.data.citySlug,
      venueName: parsed.data.venueName,
      venueAddress: parsed.data.venueAddress,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      isFree: parsed.data.isFree,
      price: parsed.data.price,
      capacity: parsed.data.capacity,
      coverImage: parsed.data.coverImage,
      status: parsed.data.status
    });

    return NextResponse.json({ success: true, event });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kayıt başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
