import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { submitInvoiceToGib } from '@/lib/accounting/einvoice';
import { readEInvoiceMeta } from '@/lib/accounting/einvoice/meta';
import { evaluateGibSendEligibility } from '@/lib/accounting/einvoice/gib-send-guard';
import { updateInvoiceDocumentType } from '@/lib/accounting/invoice';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

const bodySchema = z.object({
  force: z.boolean().optional(),
  /** Gönderim öncesi tip kaydı (opsiyonel) */
  documentType: z.enum(['e_arsiv', 'e_fatura']).optional(),
  overrideConfirmed: z.boolean().optional()
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
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Geçersiz istek' },
      { status: 400 }
    );
  }
  const force = Boolean(parsed.data.force);

  await ensureDbConnection();

  if (parsed.data.documentType) {
    try {
      await updateInvoiceDocumentType({
        invoiceId,
        type: parsed.data.documentType,
        overrideConfirmed: parsed.data.overrideConfirmed ?? true,
        actorId: guard.ctx.access.userId
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Tip güncellenemedi';
      const status = message.includes('bulunamadı')
        ? 404
        : message.includes('değiştirilemez')
          ? 409
          : 400;
      return NextResponse.json({ error: message }, { status });
    }
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      user: { select: { email: true } },
      order: { select: { attendeeEmail: true } }
    }
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 });
  }

  const einv = readEInvoiceMeta(invoice.metadata);
  const eligibility = evaluateGibSendEligibility({
    issuedAt: invoice.issuedAt,
    invoiceType: invoice.type,
    buyerTaxNumber: invoice.buyerTaxNumber,
    lastError: einv.lastError
  });

  if (!eligibility.canSend) {
    return NextResponse.json(
      {
        error: eligibility.blockReason ?? 'GİB gönderimi engellendi',
        blocked: true,
        category: eligibility.errorCategory,
        channel: eligibility.channelId,
        channelLabel: eligibility.channelLabel
      },
      { status: 409 }
    );
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

  return NextResponse.json({
    success: true,
    channel: eligibility.channelId,
    channelLabel: eligibility.channelLabel,
    ...result
  });
}
