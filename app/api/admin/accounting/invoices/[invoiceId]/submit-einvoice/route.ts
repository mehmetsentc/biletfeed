import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { submitInvoiceToGib } from '@/lib/accounting/einvoice';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

const bodySchema = z.object({
  force: z.boolean().optional()
});

interface RouteParams {
  params: Promise<{ invoiceId: string }>;
}

/** Admin: GİB e-belge gönderimini tetikle / yeniden dene */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'accounting.manage');
  if ('error' in guard) return guard.error;

  const { invoiceId } = await params;
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  const force = parsed.success ? Boolean(parsed.data.force) : false;

  await ensureDbConnection();
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { user: { select: { email: true } }, order: { select: { attendeeEmail: true } } }
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 });
  }

  const result = await submitInvoiceToGib({
    invoiceId,
    buyerEmail: invoice.user.email ?? invoice.order.attendeeEmail,
    force
  });

  if (!result.ok && !result.skipped) {
    return NextResponse.json(
      { error: result.error ?? 'GİB gönderimi başarısız', ...result },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, ...result });
}
