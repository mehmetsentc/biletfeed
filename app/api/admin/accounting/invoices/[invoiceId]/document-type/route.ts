import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { updateInvoiceDocumentType } from '@/lib/accounting/invoice';
import { ensureDbConnection } from '@/lib/db/prisma';

const bodySchema = z.object({
  type: z.enum(['e_arsiv', 'e_fatura']),
  overrideConfirmed: z.boolean().optional()
});

interface RouteParams {
  params: Promise<{ invoiceId: string }>;
}

/** Admin: fatura belge tipi (e-Arşiv / e-Fatura) */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'accounting.manage');
  if ('error' in guard) return guard.error;

  const { invoiceId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Geçersiz istek' },
      { status: 400 }
    );
  }

  await ensureDbConnection();

  try {
    const invoice = await updateInvoiceDocumentType({
      invoiceId,
      type: parsed.data.type,
      overrideConfirmed: parsed.data.overrideConfirmed,
      actorId: guard.ctx.access.userId
    });
    return NextResponse.json({ success: true, invoice });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Tip güncellenemedi';
    const status = message.includes('bulunamadı')
      ? 404
      : message.includes('değiştirilemez') || message.includes('onay gerekli')
        ? 409
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
