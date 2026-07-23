import { NextRequest, NextResponse } from 'next/server';
import { guardAdminRead } from '@/lib/auth/guard-admin-api';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { readEInvoiceMeta } from '@/lib/accounting/einvoice/meta';
import {
  LIFECYCLE_LABELS,
  resolveLifecycleStatus
} from '@/lib/accounting/einvoice/lifecycle';
import { suggestedDocumentType } from '@/lib/accounting/invoice';

interface RouteParams {
  params: Promise<{ invoiceId: string }>;
}

/** Admin: fatura detay (drawer) */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminRead('accounting.manage');
  if ('error' in guard) return guard.error;

  const { invoiceId } = await params;
  await ensureDbConnection();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: true,
      order: { select: { id: true, event: { select: { title: true } } } },
      user: { select: { email: true, displayName: true } }
    }
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 });
  }

  const einv = readEInvoiceMeta(invoice.metadata);
  const lifecycle = resolveLifecycleStatus({
    invoiceStatus: invoice.status,
    einvoice: einv,
    eInvoiceUuid: invoice.eInvoiceUuid
  });

  const meta =
    invoice.metadata &&
    typeof invoice.metadata === 'object' &&
    !Array.isArray(invoice.metadata)
      ? (invoice.metadata as Record<string, unknown>)
      : {};

  return NextResponse.json({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    type: invoice.type,
    status: invoice.status,
    lifecycle,
    lifecycleLabel: LIFECYCLE_LABELS[lifecycle],
    issuedAt: invoice.issuedAt.toISOString(),
    cancelledAt: invoice.cancelledAt?.toISOString() ?? null,
    buyerName: invoice.buyerName,
    buyerTaxNumber: invoice.buyerTaxNumber,
    buyerTaxOffice: invoice.buyerTaxOffice,
    buyerAddress: invoice.buyerAddress,
    suggestedType: suggestedDocumentType(invoice.buyerTaxNumber),
    subtotalNet: invoice.subtotalNet,
    vatRate: invoice.vatRate,
    vatAmount: invoice.vatAmount,
    totalGross: invoice.totalGross,
    currency: invoice.currency,
    eInvoiceUuid: invoice.eInvoiceUuid,
    ettn: einv.ettn ?? null,
    envelopeUuid: einv.envelopeUuid ?? null,
    channel: einv.channel ?? null,
    provider: einv.provider ?? null,
    gibStatus: einv.status ?? null,
    dispatchStatus: einv.dispatchStatus ?? null,
    needsSmsSign: Boolean(einv.needsSmsSign),
    mock: Boolean(einv.mock),
    lastError: einv.lastError ?? null,
    pdfUrl: einv.pdfUrl ?? null,
    taxpayerCheck: einv.taxpayerCheck ?? null,
    originalInvoiceNumber:
      typeof meta.originalInvoiceNumber === 'string'
        ? meta.originalInvoiceNumber
        : null,
    eventTitle: invoice.order.event?.title ?? null,
    buyerEmail: invoice.user.email ?? null,
    lines: invoice.lines.map((l) => ({
      id: l.id,
      description: l.description,
      quantity: l.quantity,
      unitPriceNet: l.unitPriceNet,
      vatRate: l.vatRate,
      vatAmount: l.vatAmount,
      totalGross: l.totalGross
    })),
    einvoiceMeta: einv
  });
}
