import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { cancelInvoiceOnChannel } from '@/lib/accounting/einvoice/cancel';

const bodySchema = z.object({
  reason: z.string().max(500).optional()
});

interface RouteParams {
  params: Promise<{ invoiceId: string }>;
}

/** Admin: kanal iptal / taslak sil + Invoice.status=cancelled */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'accounting.manage');
  if ('error' in guard) return guard.error;

  const { invoiceId } = await params;
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Geçersiz istek' },
      { status: 400 }
    );
  }

  const result = await cancelInvoiceOnChannel({
    invoiceId,
    actorId: guard.ctx.access.userId,
    reason: parsed.data.reason
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? 'İptal başarısız' },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, ...result });
}
