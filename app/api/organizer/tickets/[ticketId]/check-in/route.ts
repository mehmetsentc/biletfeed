import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { organizerManualCheckIn } from '@/lib/services/ticket-ops';

const bodySchema = z.object({
  scannerId: z.string().max(128).optional()
});

type RouteParams = { params: Promise<{ ticketId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const { ticketId } = await params;
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);

  try {
    const result = await organizerManualCheckIn(
      ticketId,
      ctx.session.uid,
      ctx.organizer.id,
      parsed.success ? parsed.data.scannerId : undefined
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Check-in başarısız' },
      { status: 400 }
    );
  }
}
