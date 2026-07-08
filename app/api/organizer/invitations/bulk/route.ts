import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { createBulkEventInvitations } from '@/lib/services/bulk-invitations';

export const runtime = 'nodejs';
export const maxDuration = 120;

const guestSchema = z.object({
  guestName: z.string().min(2).max(120),
  guestEmail: z.string().email().optional().or(z.literal('')),
  guestPhone: z.string().max(30).optional(),
  personalMessage: z.string().max(500).optional()
});

const bulkSchema = z.object({
  eventId: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
  guests: z.array(guestSchema).min(1).max(200),
  sendEmails: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const parsed = bulkSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  const guests = parsed.data.guests.map((g) => ({
    guestName: g.guestName,
    guestEmail: g.guestEmail || undefined,
    guestPhone: g.guestPhone,
    personalMessage: g.personalMessage
  }));

  const result = await createBulkEventInvitations({
    organizerId: ctx.organizer.id,
    eventId: parsed.data.eventId,
    ticketTypeId: parsed.data.ticketTypeId,
    guests,
    sendEmails: parsed.data.sendEmails ?? true
  });

  return NextResponse.json({
    success: true,
    createdCount: result.created.length,
    errorCount: result.errors.length,
    created: result.created,
    errors: result.errors,
    email: result.email ?? null
  });
}
