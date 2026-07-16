import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  resolveOrganizerSession,
  type OrganizerSessionDenyReason
} from '@/lib/auth/organizer-api';
import {
  isOrganizerProfileComplete,
  organizerProfileIncompleteError
} from '@/lib/services/organizer-profile-readiness';
import {
  updateOrganizerEvent,
  updateOrganizerEventStatus
} from '@/lib/services/organizer-events';
import {
  optionalCoverImageSchema,
  optionalOnlineUrlSchema,
  zodErrorMessage
} from '@/lib/api/zod-validation';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { setEventArtists } from '@/lib/services/artist';

const ticketCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'Kategori adı zorunludur').max(200),
  description: z.string().max(2000).optional().default(''),
  price: z.number().min(0).default(0),
  capacity: z.number().int().min(1),
  seatsPerUnit: z.number().int().min(1).max(50).optional().default(1),
  showLowStockBadge: z.boolean().optional().default(false)
});

const performerSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['person', 'group']),
  artistId: z.string().uuid().optional(),
  role: z.string().max(100).optional()
});

const attendeeQuestionSchema = z.object({
  question: z.string().min(1).max(300),
  required: z.boolean().default(true)
});

const sessionSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  eventId: z.string().uuid().optional()
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
  sessions: z.array(sessionSchema).min(2).max(50).optional(),
  isFree: z.boolean().optional(),
  price: z.number().min(0).optional(),
  capacity: z.number().int().min(1).max(1000000).optional(),
  coverImage: optionalCoverImageSchema,
  ticketCategories: z.array(ticketCategorySchema).min(1).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  venueDetail: z.string().max(2000).optional(),
  venueMapUrl: z.string().url().max(1000).optional(),
  rules: z.string().max(10000).optional(),
  isOnline: z.boolean().optional(),
  onlineUrl: optionalOnlineUrlSchema,
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

function organizerSessionError(reason: OrganizerSessionDenyReason): NextResponse {
  switch (reason) {
    case 'no_session':
      return NextResponse.json({ error: 'Panel girişi gerekli' }, { status: 401 });
    case 'no_user':
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 401 });
    case 'no_organizer':
      return NextResponse.json(
        { error: 'Organizatör profili bulunamadı. Kurulumu tamamlayın.' },
        { status: 403 }
      );
    case 'suspended':
      return NextResponse.json({ error: 'Hesabınız askıya alındı.' }, { status: 403 });
  }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolved = await resolveOrganizerSession();
  if (!resolved.ok) {
    return organizerSessionError(resolved.reason);
  }

  const { id } = await params;
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id, organizerId: resolved.ctx.organizer.id, deletedAt: null },
    include: {
      city: true,
      venue: true,
      category: true,
      ticketTypes: true,
      artists: {
        include: {
          artist: { select: { id: true, name: true, type: true, image: true } }
        },
        orderBy: { sortOrder: 'asc' }
      }
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

  const resolved = await resolveOrganizerSession();
  if (!resolved.ok) {
    return organizerSessionError(resolved.reason);
  }
  const { organizer } = resolved.ctx;

  const { id } = await params;
  const json = await request.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  }

  const data = parsed.data;

  if (data.status === 'pending' && !isOrganizerProfileComplete(organizer, resolved.ctx.user.email)) {
    return NextResponse.json({ error: organizerProfileIncompleteError() }, { status: 403 });
  }

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
        organizerId: organizer.id,
        eventId: id,
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.categorySlug && { categorySlug: data.categorySlug }),
        ...(data.citySlug && { citySlug: data.citySlug }),
        ...(data.venueName !== undefined && { venueName: data.venueName }),
        ...(data.venueAddress !== undefined && { venueAddress: data.venueAddress }),
        // For recurring edits sessions[0] carries the main event dates
        ...(data.sessions?.length
          ? {
              startDate: new Date(data.sessions[0].startDate),
              endDate: new Date(data.sessions[0].endDate)
            }
          : {
              ...(data.startDate && { startDate: new Date(data.startDate) }),
              ...(data.endDate && { endDate: new Date(data.endDate) })
            }),
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
        ...(data.venueMapUrl !== undefined && { venueMapUrl: data.venueMapUrl }),
        ...(data.hiddenFromSearch !== undefined && {
          hiddenFromSearch: data.hiddenFromSearch
        }),
        ...(data.organizerTermsAccepted !== undefined && {
          organizerTermsAccepted: data.organizerTermsAccepted
        })
      });
      // Sync EventArtist relations
      if (data.performers !== undefined) {
        const artistLinks = data.performers
          .filter((p) => p.artistId)
          .map((p, i) => ({ artistId: p.artistId!, role: p.role ?? '', sortOrder: i }));
        await setEventArtists(id, artistLinks);
      }

      // Sync recurring session dates (sessions[0] is the main event, already updated above)
      if (data.sessions && data.sessions.length >= 2) {
        for (const session of data.sessions) {
          if (!session.eventId || session.eventId === id) continue; // main event handled above
          // Verify the session event belongs to this organizer
          await prisma.event.updateMany({
            where: { id: session.eventId, organizerId: organizer.id, deletedAt: null },
            data: {
              startDate: new Date(session.startDate),
              endDate: new Date(session.endDate)
            }
          });
        }
      }

      return NextResponse.json({ success: true, event });
    }

    if (!data.status) {
      return NextResponse.json({ error: 'Güncellenecek alan bulunamadı' }, { status: 400 });
    }

    const event = await updateOrganizerEventStatus(
      organizer.id,
      id,
      data.status
    );
    return NextResponse.json({ success: true, event });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Güncelleme başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * DELETE /api/organizer/events/[id]
 * Organizatör kendi eski etkinliğini panelden gizler (soft delete).
 * Veriler sistemde korunur — yalnızca organizatör paneli görünümünden kalkar.
 * Kural: etkinlik gelecekte değilse (endDate geçmiş) VEYA taslak/iptal ise silinebilir.
 * Aktif bilet satışı olan gelecek etkinlikler silinemez.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const resolved = await resolveOrganizerSession();
  if (!resolved.ok) {
    return organizerSessionError(resolved.reason);
  }

  const { organizer } = resolved.ctx;
  const { id } = await params;
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id, organizerId: organizer.id, deletedAt: null },
    select: {
      id: true,
      status: true,
      endDate: true,
      _count: { select: { purchasedTickets: true } }
    }
  });

  if (!event) {
    return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 });
  }

  const now = new Date();
  const isPast = event.endDate < now;
  const isDraftOrCancelled = event.status === 'draft' || event.status === 'cancelled';

  if (!isPast && !isDraftOrCancelled) {
    return NextResponse.json(
      { error: 'Gelecek tarihli ve aktif etkinlikler silinemez. Önce iptal edin.' },
      { status: 400 }
    );
  }

  await prisma.event.update({
    where: { id },
    data: { deletedAt: now }
  });

  return NextResponse.json({ ok: true });
}
