import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { confirmInvoiceSmsSign } from '@/lib/accounting/einvoice/sms';

const bodySchema = z.object({
  code: z.string().trim().min(4).max(12),
  oid: z.string().trim().optional()
});

interface RouteParams {
  params: Promise<{ invoiceId: string }>;
}

/** Admin: GİB SMS kodunu doğrula ve faturayı imzala */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'accounting.manage');
  if ('error' in guard) return guard.error;

  const { invoiceId } = await params;
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçerli SMS kodu girin' }, { status: 400 });
  }

  const result = await confirmInvoiceSmsSign({
    invoiceId,
    code: parsed.data.code,
    oid: parsed.data.oid
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? 'SMS doğrulama başarısız' },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
