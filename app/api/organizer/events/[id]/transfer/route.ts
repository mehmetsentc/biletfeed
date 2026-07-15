import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { parseEventSeriesMeta } from '@/lib/organizator/event-series-meta';

const bodySchema = z.object({
  /** Email of the receiving organizer's owner account */
  targetEmail: z.string().email()
});

/** POST /api/organizer/events/[id]/transfer
 *  Transfers ownership of an event (and all its series events) to another approved organizer.
 *  Caller must be the current owner of the event.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id: eventId } = await params;
  await ensureDbConnection();

  // Verify caller owns this event
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: ctx.organizer.id, deletedAt: null },
    select: { id: true, title: true, seo: true, organizerId: true }
  });
  if (!event) {
    return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz e-posta' }, { status: 400 });
  }

  const targetEmail = parsed.data.targetEmail.toLowerCase().trim();

  // Cannot transfer to yourself
  if (targetEmail === ctx.user.email.toLowerCase()) {
    return NextResponse.json({ error: 'Etkinliği kendinize devredemezsiniz.' }, { status: 400 });
  }

  // Find the target organizer by owner email
  const targetOrganizer = await prisma.organizer.findFirst({
    where: {
      deletedAt: null,
      status: 'approved',
      owner: { email: { equals: targetEmail, mode: 'insensitive' } }
    },
    select: { id: true, name: true, slug: true }
  });

  if (!targetOrganizer) {
    return NextResponse.json(
      { error: `"${targetEmail}" adresine sahip onaylı bir organizatör bulunamadı.` },
      { status: 404 }
    );
  }

  // Collect all events to transfer (the main event + any series siblings)
  const eventIds: string[] = [event.id];
  const seriesMeta = parseEventSeriesMeta(event.seo);
  if (seriesMeta?.seriesId) {
    const siblings = await prisma.event.findMany({
      where: {
        organizerId: ctx.organizer.id,
        deletedAt: null,
        id: { not: event.id },
        seo: { path: ['seriesId'], equals: seriesMeta.seriesId }
      },
      select: { id: true }
    });
    eventIds.push(...siblings.map((s) => s.id));
  }

  // Transfer all events
  await prisma.event.updateMany({
    where: { id: { in: eventIds }, organizerId: ctx.organizer.id },
    data: { organizerId: targetOrganizer.id }
  });

  return NextResponse.json({
    success: true,
    transferred: eventIds.length,
    targetOrganizer: {
      id: targetOrganizer.id,
      name: targetOrganizer.name,
      slug: targetOrganizer.slug
    }
  });
}
