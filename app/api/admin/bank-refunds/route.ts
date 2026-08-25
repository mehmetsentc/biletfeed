import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation, guardAdminRead } from '@/lib/auth/guard-admin-api';
import {
  listBankRefundRequests,
  updateBankRefundRequestStatus
} from '@/lib/services/bank-refund';

export async function GET() {
  const guard = await guardAdminRead('orders.refund');
  if ('error' in guard) return guard.error;

  const rows = await listBankRefundRequests();
  return NextResponse.json({ requests: rows });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'sent', 'completed', 'cancelled']),
  paymentRef: z.string().max(120).optional()
});

export async function PATCH(request: NextRequest) {
  const guard = await guardAdminMutation(request, 'orders.refund');
  if ('error' in guard) return guard.error;

  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  await updateBankRefundRequestStatus({
    id: parsed.data.id,
    status: parsed.data.status,
    paymentRef: parsed.data.paymentRef,
    processedBy: guard.ctx.session.uid
  });

  return NextResponse.json({ ok: true });
}
