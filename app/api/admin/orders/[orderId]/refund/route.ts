import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { processOrderRefund } from '@/lib/services/order-refund';

const bodySchema = z.object({
  reason: z.string().max(500).optional(),
  ticketIds: z.array(z.string().uuid()).optional(),
  cancelOnly: z.boolean().optional(),
  fallbackBankRefund: z.boolean().optional(),
  bankDetails: z
    .object({
      accountHolder: z.string().trim().min(2).max(120),
      iban: z.string().trim().min(15).max(34)
    })
    .optional()
});

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'orders.refund');
  if ('error' in guard) return guard.error;

  const { orderId } = await params;
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  try {
    const result = await processOrderRefund({
      orderId,
      reason: parsed.data.reason,
      ticketIds: parsed.data.ticketIds,
      cancelOnly: parsed.data.cancelOnly,
      fallbackBankRefund: parsed.data.fallbackBankRefund,
      bankDetails: parsed.data.bankDetails,
      actorId: guard.ctx.session.uid
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.message,
          needsBankRefund: result.needsBankRefund
        },
        { status: result.needsBankRefund ? 422 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      mode: result.mode,
      bankRefundRequestId: result.bankRefundRequestId,
      providerRefundId: result.providerRefundId
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'İade başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
