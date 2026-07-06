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
import { createOrganizerEvent, createOrganizerEventSeries } from '@/lib/services/organizer-events';
import { listOrganizerEventsDetailed } from '@/lib/services/organizer-events';

const ticketCategorySchema = z.object({
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

const eventExtrasSchema = {
  tags: z.array(z.string().max(50)).max(20).optional(),
  venueDetail: z.string().max(2000).optional(),
  rules: z.string().max(10000).optional(),
  isOnline: z.boolean().optional(),
  onlineUrl: z.string().url().max(500).optional().or(z.literal('')),
  performers: z.array(performerSchema).max(50).optional(),
  attendeeQuestions: z.array(attendeeQuestionSchema).max(30).optional(),
  preventQuestionCopy: z.boolean().optional(),
  accessPassword: z.string().max(100).optional(),
  hiddenFromSearch: z.boolean().optional(),
  organizerTermsAccepted: z.boolean().optional()
};

const sessionDateSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

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
  capacity: z.number().int().min(1).max(1000000),
  coverImage: z.string().url().optional(),
  status: z.enum(['draft', 'published', 'pending']).optional(),
  ticketCategories: z.array(ticketCategorySchema).min(1).optional(),
  sessions: z.array(sessionDateSchema).min(2).max(50).optional(),
  ...eventExtrasSchema
});

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

export async function GET() {
  const resolved = await resolveOrganizerSession();
  if (!resolved.ok) {
    return organizerSessionError(resolved.reason);
  }

  const events = await listOrganizerEventsDetailed(resolved.ctx.organizer.id);
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const resolved = await resolveOrganizerSession();
  if (!resolved.ok) {
    return organizerSessionError(resolved.reason);
  }
  const { organizer } = resolved.ctx;

  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  if (!isOrganizerProfileComplete(organizer)) {
    return NextResponse.json({ error: organizerProfileIncompleteError() }, { status: 403 });
  }

  if (parsed.data.status === 'published') {
    return NextResponse.json(
      { error: 'Etkinlikleri doğrudan yayınlayamazsınız. Onaya gönderin.' },
      { status: 403 }
    );
  }

  if (
    parsed.data.status === 'pending' &&
    parsed.data.organizerTermsAccepted !== true
  ) {
    return NextResponse.json(
      { error: 'Onaya göndermek için organizatör sözleşmesini kabul etmelisiniz.' },
      { status: 400 }
    );
  }

  try {
    const baseInput = {
      organizerId: organizer.id,
      title: parsed.data.title,
      description: parsed.data.description,
      categorySlug: parsed.data.categorySlug,
      citySlug: parsed.data.citySlug,
      venueName: parsed.data.venueName,
      venueAddress: parsed.data.venueAddress,
      isFree: parsed.data.isFree,
      price: parsed.data.price,
      capacity: parsed.data.capacity,
      coverImage: parsed.data.coverImage,
      status: parsed.data.status,
      ticketCategories: parsed.data.ticketCategories,
      tags: parsed.data.tags,
      venueDetail: parsed.data.venueDetail,
      isOnline: parsed.data.isOnline,
      onlineUrl: parsed.data.onlineUrl || undefined,
      performers: parsed.data.performers,
      attendeeQuestions: parsed.data.attendeeQuestions,
      preventQuestionCopy: parsed.data.preventQuestionCopy,
      accessPassword: parsed.data.accessPassword,
      hiddenFromSearch: parsed.data.hiddenFromSearch,
      organizerTermsAccepted: parsed.data.organizerTermsAccepted
    };

    if (parsed.data.sessions && parsed.data.sessions.length >= 2) {
      const events = await createOrganizerEventSeries({
        ...baseInput,
        sessions: parsed.data.sessions.map((s) => ({
          startDate: new Date(s.startDate),
          endDate: new Date(s.endDate)
        }))
      });

      return NextResponse.json({ success: true, events, event: events[0] });
    }

    const event = await createOrganizerEvent({
      ...baseInput,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate)
    });

    return NextResponse.json({ success: true, event });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kayıt başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
