import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { updateOrganizerEventStatus } from '@/lib/services/organizer-events';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

const patchSchema = z.object({
  status: z.enum(['draft', 'published', 'pending', 'cancelled']).optional()
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
  if (!parsed.success || !parsed.data.status) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    const event = await updateOrganizerEventStatus(
      ctx.organizer.id,
      id,
      parsed.data.status
    );
    return NextResponse.json({ success: true, event });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Güncelleme başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
