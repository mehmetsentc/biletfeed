import { after, NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import {
  createBulkEventInvitations,
  sendBulkInvitationEmails
} from '@/lib/services/bulk-invitations';

export const runtime = 'nodejs';
export const maxDuration = 300;

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

  const wantEmail = parsed.data.sendEmails ?? true;

  // Hızlı oluştur — PDF/e-posta HTTP yanıtını bloklamasın (Failed to fetch önlenir)
  const result = await createBulkEventInvitations({
    organizerId: ctx.organizer.id,
    eventId: parsed.data.eventId,
    ticketTypeId: parsed.data.ticketTypeId,
    guests,
    sendEmails: false
  });

  const emailIds = result.created
    .filter((row) => row.guestEmail?.trim())
    .map((row) => row.id);

  let emailStatus: 'queued' | 'skipped' = 'skipped';
  if (wantEmail && emailIds.length > 0) {
    emailStatus = 'queued';
    const organizerId = ctx.organizer.id;
    after(async () => {
      try {
        await sendBulkInvitationEmails({
          organizerId,
          invitationIds: emailIds
        });
      } catch (err) {
        console.error('[email] bulk invitations after()', err);
      }
    });
  }

  return NextResponse.json({
    success: true,
    createdCount: result.created.length,
    errorCount: result.errors.length,
    created: result.created,
    errors: result.errors,
    emailStatus,
    emailQueued: emailStatus === 'queued' ? emailIds.length : 0
  });
}
