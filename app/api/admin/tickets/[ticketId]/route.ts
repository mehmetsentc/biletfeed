import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie, sessionHasRole } from '@/lib/auth/session';
import {
  adminCancelTicket,
  adminForceCheckIn,
  adminRegenerateQr
} from '@/lib/services/ticket-ops';

const actionSchema = z.object({
  action: z.enum(['force_check_in', 'cancel', 'regenerate_qr'])
});

type RouteParams = { params: Promise<{ ticketId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await verifySessionCookie();
  if (!session || !sessionHasRole(session, 'ROLE_ADMIN')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { ticketId } = await params;
  const json = await request.json();
  const parsed = actionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
  }

  try {
    switch (parsed.data.action) {
      case 'force_check_in': {
        const result = await adminForceCheckIn(ticketId, session.uid);
        return NextResponse.json(result);
      }
      case 'cancel':
        await adminCancelTicket(ticketId);
        return NextResponse.json({ ok: true, message: 'Bilet iptal edildi' });
      case 'regenerate_qr': {
        const result = await adminRegenerateQr(ticketId);
        return NextResponse.json({ ok: true, ...result });
      }
      default:
        return NextResponse.json({ error: 'Bilinmeyen işlem' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'İşlem başarısız' },
      { status: 400 }
    );
  }
}
