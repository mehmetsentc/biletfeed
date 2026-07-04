import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
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
  const guard = await guardAdminMutation(request, 'tickets.manage');
  if ('error' in guard) return guard.error;

  const { ticketId } = await params;
  const json = await request.json();
  const parsed = actionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
  }

  const { uid } = guard.ctx.session;

  try {
    switch (parsed.data.action) {
      case 'force_check_in': {
        const result = await adminForceCheckIn(ticketId, uid);
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
