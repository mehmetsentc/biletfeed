import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation, guardAdminRead } from '@/lib/auth/guard-admin-api';
import {
  listOrganizerRefundRequests,
  reviewOrganizerRefundRequest
} from '@/lib/services/bank-refund';

export async function GET(request: NextRequest) {
  const guard = await guardAdminRead('orders.refund');
  if ('error' in guard) return guard.error;

  const status = new URL(request.url).searchParams.get('status') as
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'completed'
    | 'cancelled'
    | null;

  const rows = await listOrganizerRefundRequests({
    status: status ?? 'pending'
  });
  return NextResponse.json({ requests: rows });
}

const bodySchema = z.object({
  id: z.string().uuid(),
  approve: z.boolean(),
  reviewNote: z.string().max(500).optional(),
  bankDetails: z
    .object({
      accountHolder: z.string().min(2).max(120),
      iban: z.string().min(15).max(34)
    })
    .optional()
});

export async function POST(request: NextRequest) {
  const guard = await guardAdminMutation(request, 'orders.refund');
  if ('error' in guard) return guard.error;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  try {
    const result = await reviewOrganizerRefundRequest({
      id: parsed.data.id,
      approve: parsed.data.approve,
      reviewNote: parsed.data.reviewNote,
      reviewedBy: guard.ctx.session.uid,
      bankDetails: parsed.data.bankDetails
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 422 });
    }
    return NextResponse.json({ success: true, message: result.message });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'İşlem başarısız' },
      { status: 400 }
    );
  }
}
