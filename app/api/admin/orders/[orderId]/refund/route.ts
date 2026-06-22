import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { adminUnauthorized, requireAdminSession } from '@/lib/auth/admin-api';
import { requestOrderRefund } from '@/lib/services/orders';

const bodySchema = z.object({
  reason: z.string().max(500).optional()
});

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session) return adminUnauthorized();

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
