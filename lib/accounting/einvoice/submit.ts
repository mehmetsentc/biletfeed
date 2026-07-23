import type { Invoice, InvoiceLine, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { logAccountingAudit } from '@/lib/accounting/audit';
import { getEInvoiceConfig } from '@/lib/accounting/einvoice/config';
import { withGibSessionLock } from '@/lib/accounting/einvoice/gib-lock';
import {
  EFATURA_BUYER_BLOCK_MESSAGE,
  evaluateGibSendEligibility
} from '@/lib/accounting/einvoice/gib-send-guard';
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

  const eligibility = evaluateGibSendEligibility({
    issuedAt: invoice.issuedAt,
    invoiceType: invoice.type,
    buyerTaxNumber: invoice.buyerTaxNumber,
    lastError: existing.lastError
  });

  if (!eligibility.canSend) {
    const blockMeta: InvoiceEInvoiceMeta = {
      provider: existing.provider ?? config.provider,
      status: 'failed',
      ettn: typeof existing.ettn === 'string' ? existing.ettn : undefined,
      uuid: existing.uuid,
      pdfUrl: existing.pdfUrl,
      providerRef: existing.providerRef,
      submittedAt: existing.submittedAt,
      lastError: eligibility.blockReason ?? EFATURA_BUYER_BLOCK_MESSAGE,
      mock: existing.mock,
      needsSmsSign: existing.needsSmsSign,
      smsOid: existing.smsOid,
      smsPhoneMasked: existing.smsPhoneMasked
    };
    await persistEInvoiceState(invoice, blockMeta, 'leave');
    await logAccountingAudit({
      action: 'einvoice.blocked',
      entityType: 'invoice',
      entityId: invoice.id,
      after: {
        reason: eligibility.blockReason,
        category: eligibility.errorCategory
      }
    });
    return {
      ok: false,
      status: 'failed',
      error: eligibility.blockReason
    };
  }

  const provider = getEInvoiceProvider(config);
  if (!provider) {
    const skippedMeta: InvoiceEInvoiceMeta = {
      provider: 'none',
      status: 'skipped',
      lastError: 'EINVOICE_PROVIDER=none veya API yapılandırılmadı'
    };
    await persistEInvoiceState(invoice, skippedMeta, 'leave');
    return { ok: true, skipped: true, status: 'skipped' };
  }

  // e-Arşiv portal yalnızca e_arsiv; e_fatura / 10 hane VKN burada ikinci kez engellenir
  if (
    provider.name === 'gib' &&
    (invoice.type === 'e_fatura' ||
      (invoice.buyerTaxNumber ?? '').replace(/\D/g, '').length === 10)
  ) {
    return {
      ok: false,
      status: 'failed',
      error: EFATURA_BUYER_BLOCK_MESSAGE
    };
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
    result = await withGibSessionLock(() => provider.submit(payload));
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
    // Başarısız create'te üretilen ETTN'yi uuid sanma; yalnızca GİB kabulünden sonra
    ettn: result.ok
      ? (result.ettn ?? payload.ettn)
      : typeof existing.ettn === 'string'
        ? existing.ettn
        : undefined,
    uuid: result.ok ? result.uuid : existing.uuid,
    pdfUrl: result.ok ? result.pdfUrl : existing.pdfUrl,
    providerRef: result.providerRef,
    submittedAt: new Date().toISOString(),
    lastError: result.error,
    mock: provider.name === 'mock',
    needsSmsSign: result.ok
      ? Boolean(
          result.raw &&
            typeof result.raw === 'object' &&
            (result.raw as { needsSmsSign?: boolean }).needsSmsSign
        ) || result.status === 'submitted'
      : false
  };

  // eInvoiceUuid: yalnızca GİB taslağı kabul edildikten / resolve edildikten sonra
  let uuidMode: 'set' | 'clear' | 'leave' = 'leave';
  if (result.ok && result.uuid) {
    uuidMode = 'set';
  } else if (!result.ok) {
    const stored = invoice.eInvoiceUuid;
    const looksGenerated =
      stored &&
      (stored === payload.ettn ||
        stored === existing.ettn ||
        stored === existing.uuid);
    const neverAcceptedByGib =
      !existing.uuid || existing.uuid === payload.ettn;
    if (looksGenerated && neverAcceptedByGib) {
      uuidMode = 'clear';
    }
  }

  await persistEInvoiceState(
    invoice,
    nextMeta,
    uuidMode,
    result.ok ? result.uuid : undefined
  );

  await logAccountingAudit({
    action: result.ok ? 'einvoice.submitted' : 'einvoice.failed',
    entityType: 'invoice',
    entityId: invoice.id,
    after: {
      status: nextMeta.status,
      uuid: result.ok ? nextMeta.uuid : null,
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
    uuid: result.ok ? (result.uuid ?? undefined) : undefined,
    error: result.error
  };
}

async function persistEInvoiceState(
  invoice: InvoiceWithLines | Invoice,
  einvoice: InvoiceEInvoiceMeta,
  uuidMode: 'set' | 'clear' | 'leave' = 'leave',
  uuid?: string
) {
  const meta = asRecord(invoice.metadata);
  meta.einvoice = einvoice;

  const data: Prisma.InvoiceUpdateInput = {
    metadata: meta as Prisma.InputJsonValue
  };

  if (uuidMode === 'set' && uuid) {
    data.eInvoiceUuid = uuid;
  } else if (uuidMode === 'clear') {
    data.eInvoiceUuid = null;
  }

  await prisma.invoice.update({
    where: { id: invoice.id },
    data
  });
}
