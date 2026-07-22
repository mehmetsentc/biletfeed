import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { markPayoutPaid } from '@/lib/accounting/commission';

const bodySchema = z.object({
  paymentRef: z.string().trim().min(1, 'Ödeme referansı zorunlu').max(200),
  ibanSnapshot: z.string().trim().max(34).optional()
});

interface RouteParams {
  params: Promise<{ payoutId: string }>;
}

/** Admin: hakedişi ödendi işaretle */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'accounting.manage');
  if ('error' in guard) return guard.error;

  const { payoutId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Geçersiz istek' },
      { status: 400 }
    );
  }

  const paidBy =
    guard.ctx.access.userId !== 'bootstrap'
      ? guard.ctx.access.userId
      : guard.ctx.session.email ?? guard.ctx.session.uid;

  try {
    const payout = await markPayoutPaid({
      payoutId,
      paymentRef: parsed.data.paymentRef,
      paidBy,
      ibanSnapshot: parsed.data.ibanSnapshot
    });
    return NextResponse.json({ success: true, payout });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Hakediş güncellenemedi';
    const status = message.includes('bulunamadı') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
