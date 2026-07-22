import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { cancelPayout } from '@/lib/accounting/commission';

const bodySchema = z.object({
  reason: z.string().trim().max(500).optional()
});

interface RouteParams {
  params: Promise<{ payoutId: string }>;
}

/** Admin: hakediş iptal */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'accounting.manage');
  if ('error' in guard) return guard.error;

  const { payoutId } = await params;
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  const reason = parsed.success ? parsed.data.reason : undefined;

  try {
    const payout = await cancelPayout({
      payoutId,
      actorId: guard.ctx.access.userId,
      reason: reason ?? 'admin_cancel'
    });
    return NextResponse.json({ success: true, payout });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Hakediş iptal edilemedi';
    const status = message.includes('bulunamadı') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
