import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import {
  createEventInvitation,
  listEventInvitations
} from '@/lib/services/event-invitations';

export const runtime = 'nodejs';
export const maxDuration = 60;

const createSchema = z.object({
  eventId: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
  guestName: z.string().min(2).max(120),
  guestEmail: z.string().email().optional().or(z.literal('')),
  guestPhone: z.string().max(30).optional(),
  personalMessage: z.string().max(500).optional()
});

export async function GET(request: NextRequest) {
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get('eventId') || undefined;
  const invitations = await listEventInvitations(ctx.organizer.id, eventId);
  return NextResponse.json({ invitations });
}

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

  try {
    const invitation = await createEventInvitation({
      organizerId: ctx.organizer.id,
      eventId: parsed.data.eventId,
      ticketTypeId: parsed.data.ticketTypeId,
      guestName: parsed.data.guestName,
      guestEmail: parsed.data.guestEmail || undefined,
      guestPhone: parsed.data.guestPhone,
      personalMessage: parsed.data.personalMessage
    });

    const { emailStatus, emailError, ...invite } = invitation;
    return NextResponse.json({
      success: true,
      invitation: invite,
      emailStatus: emailStatus ?? 'skipped',
      emailError: emailError ?? null
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Davetiye oluşturulamadı';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
