import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import {
  updateOrganizerEvent,
  updateOrganizerEventStatus
} from '@/lib/services/organizer-events';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

const ticketCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  price: z.number().min(0).default(0),
  capacity: z.number().int().min(1),
  showLowStockBadge: z.boolean().optional().default(false)
});

const performerSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['person', 'group'])
});

const attendeeQuestionSchema = z.object({
  question: z.string().min(1).max(300),
  required: z.boolean().default(true)
});

const patchSchema = z.object({
  status: z.enum(['draft', 'published', 'pending', 'cancelled']).optional(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(10000).optional(),
  categorySlug: z.string().min(1).optional(),
  citySlug: z.string().min(1).optional(),
  venueName: z.string().max(200).optional(),
  venueAddress: z.string().max(300).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isFree: z.boolean().optional(),
  price: z.number().min(0).optional(),
  capacity: z.number().int().min(1).max(1000000).optional(),
  coverImage: z.string().url().optional(),
  ticketCategories: z.array(ticketCategorySchema).min(1).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  venueDetail: z.string().max(2000).optional(),
  isOnline: z.boolean().optional(),
  onlineUrl: z.string().url().max(500).optional().or(z.literal('')),
  performers: z.array(performerSchema).max(50).optional(),
  attendeeQuestions: z.array(attendeeQuestionSchema).max(30).optional(),
  preventQuestionCopy: z.boolean().optional(),
  accessPassword: z.string().max(100).optional(),
  hiddenFromSearch: z.boolean().optional(),
  organizerTermsAccepted: z.boolean().optional()
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await params;
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id, organizerId: ctx.organizer.id, deletedAt: null },
    include: {
      city: true,
      venue: true,
      category: true,
      ticketTypes: true
    }
  });

  if (!event) {
    return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  }

  return NextResponse.json({ event });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await params;
  const json = await request.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  const data = parsed.data;

  if (data.status === 'published') {
    return NextResponse.json(
      { error: 'Etkinlikleri doğrudan yayınlayamazsınız. Onaya gönderin.' },
      { status: 403 }
    );
  }

  if (
    data.status === 'pending' &&
    data.organizerTermsAccepted !== true
  ) {
    return NextResponse.json(
      { error: 'Onaya göndermek için organizatör sözleşmesini kabul etmelisiniz.' },
      { status: 400 }
    );
  }

  const hasContentUpdate = Object.keys(data).some((key) => key !== 'status');

  try {
    if (hasContentUpdate) {
      const event = await updateOrganizerEvent({
        organizerId: ctx.organizer.id,
        eventId: id,
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.categorySlug && { categorySlug: data.categorySlug }),
        ...(data.citySlug && { citySlug: data.citySlug }),
        ...(data.venueName !== undefined && { venueName: data.venueName }),
        ...(data.venueAddress !== undefined && { venueAddress: data.venueAddress }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.isFree !== undefined && { isFree: data.isFree }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.coverImage && { coverImage: data.coverImage }),
        ...(data.status && { status: data.status }),
        ...(data.ticketCategories && { ticketCategories: data.ticketCategories }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.venueDetail !== undefined && { venueDetail: data.venueDetail }),
        ...(data.isOnline !== undefined && { isOnline: data.isOnline }),
        ...(data.onlineUrl !== undefined && { onlineUrl: data.onlineUrl || undefined }),
        ...(data.performers !== undefined && { performers: data.performers }),
        ...(data.attendeeQuestions !== undefined && {
          attendeeQuestions: data.attendeeQuestions
        }),
        ...(data.preventQuestionCopy !== undefined && {
          preventQuestionCopy: data.preventQuestionCopy
        }),
        ...(data.accessPassword !== undefined && { accessPassword: data.accessPassword }),
        ...(data.hiddenFromSearch !== undefined && {
          hiddenFromSearch: data.hiddenFromSearch
        }),
        ...(data.organizerTermsAccepted !== undefined && {
          organizerTermsAccepted: data.organizerTermsAccepted
        })
      });
      return NextResponse.json({ success: true, event });
    }

    if (!data.status) {
      return NextResponse.json({ error: 'Güncellenecek alan bulunamadı' }, { status: 400 });
    }

    const event = await updateOrganizerEventStatus(
      ctx.organizer.id,
      id,
      data.status
    );
    return NextResponse.json({ success: true, event });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Güncelleme başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
