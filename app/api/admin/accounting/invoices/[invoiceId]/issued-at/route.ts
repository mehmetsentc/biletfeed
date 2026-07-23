import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { updateInvoiceIssuedAt } from '@/lib/accounting/invoice';
import { ensureDbConnection } from '@/lib/db/prisma';

const bodySchema = z.object({
  issuedAt: z
    .string()
    .min(1)
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: 'Geçersiz tarih (ISO veya parse edilebilir string)'
    })
});

interface RouteParams {
  params: Promise<{ invoiceId: string }>;
}

/** Admin: fatura tarihi düzelt (yalnızca GİB hata/draft/none) */
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
    const invoice = await updateInvoiceIssuedAt({
      invoiceId,
      issuedAt: new Date(parsed.data.issuedAt),
      actorId: guard.ctx.access.userId
    });
    return NextResponse.json({ success: true, invoice });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Tarih güncellenemedi';
    const status = message.includes('bulunamadı')
      ? 404
      : message.includes('değiştirilemez')
        ? 409
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
