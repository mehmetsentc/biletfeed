import type { Invoice, InvoiceLine, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { logAccountingAudit } from '@/lib/accounting/audit';
import { getEInvoiceConfig } from '@/lib/accounting/einvoice/config';
import { getEInvoiceProvider } from '@/lib/accounting/einvoice/provider';
import { buildEInvoicePayload } from '@/lib/accounting/einvoice/ubl';
import type {
  EInvoiceDocumentKind,
  InvoiceEInvoiceMeta
} from '@/lib/accounting/einvoice/types';

type InvoiceWithLines = Invoice & { lines: InvoiceLine[] };

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

function mapKind(type: Invoice['type']): EInvoiceDocumentKind {
  if (type === 'e_fatura') return 'e_fatura';
  if (type === 'credit_note') return 'credit_note';
  return 'e_arsiv';
}

export async function submitInvoiceToGib(params: {
  invoiceId: string;
  buyerEmail?: string | null;
  force?: boolean;
}): Promise<{
  ok: boolean;
  skipped?: boolean;
  status: string;
  uuid?: string;
  error?: string;
}> {
  const config = getEInvoiceConfig();
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: { lines: true }
  });

  if (!invoice) {
    return { ok: false, status: 'failed', error: 'Fatura bulunamadı' };
  }

  const meta = asRecord(invoice.metadata);
  const existing = asRecord(meta.einvoice) as Partial<InvoiceEInvoiceMeta>;

  if (
    !params.force &&
    existing.status &&
    (existing.status === 'accepted' || existing.status === 'submitted') &&
    (invoice.eInvoiceUuid || existing.uuid)
  ) {
    return {
      ok: true,
      skipped: true,
      status: existing.status,
      uuid: invoice.eInvoiceUuid ?? existing.uuid
    };
  }

  const provider = getEInvoiceProvider(config);
  if (!provider) {
    const skippedMeta: InvoiceEInvoiceMeta = {
      provider: 'none',
      status: 'skipped',
      lastError: 'EINVOICE_PROVIDER=none veya API yapılandırılmadı'
    };
    await persistEInvoiceState(invoice, skippedMeta);
    return { ok: true, skipped: true, status: 'skipped' };
  }

  const taxDigits = (invoice.buyerTaxNumber ?? '').replace(/\D/g, '');
  const payload = buildEInvoicePayload({
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    kind: mapKind(invoice.type),
    issuedAt: invoice.issuedAt,
    currency: invoice.currency,
    subtotalNet: invoice.subtotalNet,
    vatRate: invoice.vatRate,
    vatAmount: invoice.vatAmount,
    totalGross: invoice.totalGross,
    buyer: {
      name: invoice.buyerName,
      taxNumber: invoice.buyerTaxNumber,
      taxOffice: invoice.buyerTaxOffice,
      address: invoice.buyerAddress,
      email: params.buyerEmail,
      isCorporate: taxDigits.length === 10
    },
    lines: invoice.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPriceNet: l.unitPriceNet,
      vatRate: l.vatRate,
      vatAmount: l.vatAmount,
      totalGross: l.totalGross
    })),
    originalInvoiceNumber:
      typeof asRecord(invoice.metadata).originalInvoiceNumber === 'string'
        ? (asRecord(invoice.metadata).originalInvoiceNumber as string)
        : null,
    originalEttn:
      typeof existing.uuid === 'string' ? existing.uuid : null,
    ettn: typeof existing.ettn === 'string' ? existing.ettn : undefined
  });

  // Credit note: orijinal UUID metadata'dan
  if (invoice.type === 'credit_note') {
    const originalId =
      typeof asRecord(invoice.metadata).originalInvoiceId === 'string'
        ? (asRecord(invoice.metadata).originalInvoiceId as string)
        : null;
    if (originalId) {
      const original = await prisma.invoice.findUnique({
        where: { id: originalId },
        select: { eInvoiceUuid: true, invoiceNumber: true, metadata: true }
      });
      if (original) {
        payload.originalEttn =
          original.eInvoiceUuid ??
          (asRecord(asRecord(original.metadata).einvoice).uuid as
            | string
            | undefined) ??
          null;
        payload.originalInvoiceNumber = original.invoiceNumber;
      }
    }
  }

  let result;
  try {
    result = await provider.submit(payload);
  } catch (err) {
    result = {
      ok: false as const,
      status: 'failed' as const,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  const nextMeta: InvoiceEInvoiceMeta = {
    provider: provider.name,
    status: result.status,
    ettn: result.ettn ?? payload.ettn,
    uuid: result.uuid,
    pdfUrl: result.pdfUrl,
    providerRef: result.providerRef,
    submittedAt: new Date().toISOString(),
    lastError: result.error,
    mock: provider.name === 'mock',
    needsSmsSign:
      Boolean(
        result.raw &&
          typeof result.raw === 'object' &&
          (result.raw as { needsSmsSign?: boolean }).needsSmsSign
      ) || result.status === 'submitted'
  };

  await persistEInvoiceState(invoice, nextMeta, result.uuid ?? payload.ettn);

  await logAccountingAudit({
    action: result.ok ? 'einvoice.submitted' : 'einvoice.failed',
    entityType: 'invoice',
    entityId: invoice.id,
    after: {
      status: nextMeta.status,
      uuid: nextMeta.uuid,
      provider: provider.name,
      error: result.error
    }
  });

  if (!result.ok && !config.failSoft) {
    return {
      ok: false,
      status: result.status,
      uuid: result.uuid,
      error: result.error
    };
  }

  return {
    ok: result.ok || config.failSoft,
    status: result.status,
    uuid: result.uuid ?? payload.ettn,
    error: result.error
  };
}

async function persistEInvoiceState(
  invoice: InvoiceWithLines | Invoice,
  einvoice: InvoiceEInvoiceMeta,
  uuid?: string
) {
  const meta = asRecord(invoice.metadata);
  meta.einvoice = einvoice;

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      eInvoiceUuid: uuid ?? einvoice.uuid ?? invoice.eInvoiceUuid,
      metadata: meta as Prisma.InputJsonValue
    }
  });
}
