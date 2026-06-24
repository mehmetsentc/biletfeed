import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/session';
import { getTicketById } from '@/lib/services/tickets';
import { incrementTicketDownload } from '@/lib/services/ticket-validation';
import { isSameOriginRequest } from '@/lib/auth/csrf';

interface RouteParams {
  params: Promise<{ ticketId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await verifySessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  }

  const { ticketId } = await params;
  const ticket = await getTicketById(ticketId, session.uid);
  if (!ticket) {
    return NextResponse.json({ error: 'Bilet bulunamadı' }, { status: 404 });
  }

  await incrementTicketDownload(ticketId);
  return NextResponse.json({ ok: true });
}
