import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { requestOrderRefund } from '@/lib/services/orders';

const bodySchema = z.object({
  reason: z.string().max(500).optional()
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

  try {
    const result = await requestOrderRefund({
      orderId,
      reason: parsed.success ? parsed.data.reason : undefined
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 501 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'İade başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
