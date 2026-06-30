import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { organizerResendTicketEmail } from '@/lib/services/ticket-ops';

type RouteParams = { params: Promise<{ ticketId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const { ticketId } = await params;

  try {
    await organizerResendTicketEmail(ticketId, ctx.organizer.id);
    return NextResponse.json({ ok: true, message: 'Bilet e-postası gönderildi' });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gönderim başarısız' },
      { status: 400 }
    );
  }
}
