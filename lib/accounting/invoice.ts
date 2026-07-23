import type { InvoiceType } from '@prisma/client';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { companyLegal } from '@/lib/config/company';
import { splitGrossAmount } from '@/lib/accounting/tax';
import { logAccountingAudit } from '@/lib/accounting/audit';
import { readEInvoiceMeta } from '@/lib/accounting/einvoice/meta';

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BF${year}`;
  const last = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true }
  });
  const seq = last
    ? Number.parseInt(last.invoiceNumber.slice(prefix.length), 10) + 1
    : 1;
  return `${prefix}${String(seq).padStart(6, '0')}`;
}

/** VKN/TCKN: yalnızca rakamlar; 10 hane → e-Fatura adayı */
export function normalizeTaxIdDigits(
  buyerTaxNumber?: string | null
): string {
  return (buyerTaxNumber ?? '').replace(/\D/g, '');
}

export function resolveInvoiceType(
  buyerTaxNumber?: string | null
): InvoiceType {
  if (normalizeTaxIdDigits(buyerTaxNumber).length === 10) return 'e_fatura';
  return 'e_arsiv';
}

/** Admin UI: önerilen tip (override edilebilir) */
export function suggestedDocumentType(
  buyerTaxNumber?: string | null
): 'e_arsiv' | 'e_fatura' {
  return resolveInvoiceType(buyerTaxNumber) === 'e_fatura'
    ? 'e_fatura'
    : 'e_arsiv';
}

export type EditableInvoiceDocumentType = 'e_arsiv' | 'e_fatura';

/**
 * Admin: fatura belge tipini e_arsiv / e_fatura olarak kaydet.
 * GİB’e başarıyla gönderilmiş kayıtlarda tip kilitlenir.
 */
export async function updateInvoiceDocumentType(params: {
  invoiceId: string;
  type: EditableInvoiceDocumentType;
  actorId?: string | null;
  /** Önerilen tip ile farklıysa admin onayı alındı */
  overrideConfirmed?: boolean;
}): Promise<{
  id: string;
  type: InvoiceType;
  suggestedType: EditableInvoiceDocumentType;
}> {
  await ensureDbConnection();

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    select: {
      id: true,
      type: true,
      buyerTaxNumber: true,
      metadata: true,
      eInvoiceUuid: true
    }
  });
  if (!invoice) {
    throw new Error('Fatura bulunamadı');
  }

  if (invoice.type === 'credit_note' || invoice.type === 'proforma') {
    throw new Error('Bu fatura tipinde belge türü değiştirilemez');
  }

  const einv = readEInvoiceMeta(invoice.metadata);
  const gibStatus =
    einv.status ?? (invoice.eInvoiceUuid ? 'submitted' : undefined);
  if (!canEditInvoiceIssuedAt(gibStatus)) {
    throw new Error(
      'GİB’e gönderilmiş veya onaylı faturada belge tipi değiştirilemez'
    );
  }

  const suggested = suggestedDocumentType(invoice.buyerTaxNumber);
  if (params.type !== suggested && !params.overrideConfirmed) {
    throw new Error(
      `Önerilen tip ${suggested === 'e_fatura' ? 'e-Fatura' : 'e-Arşiv'} — farklı seçim için onay gerekli`
    );
  }

  if (invoice.type === params.type) {
    return {
      id: invoice.id,
      type: invoice.type,
      suggestedType: suggested
    };
  }

  const updated = await prisma.invoice.update({
    where: { id: params.invoiceId },
    data: { type: params.type },
    select: { id: true, type: true }
  });

  await logAccountingAudit({
    action: 'invoice.documentType.updated',
    entityType: 'invoice',
    entityId: invoice.id,
    actorId: params.actorId,
    actorRole: 'admin',
    before: { type: invoice.type },
    after: {
      type: updated.type,
      suggestedType: suggested,
      overrideConfirmed: Boolean(params.overrideConfirmed)
    }
  });

  return {
    id: updated.id,
    type: updated.type,
    suggestedType: suggested
  };
}

export interface CreateSaleInvoiceInput {
  orderId: string;
  userId: string;
  buyerName: string;
  buyerTaxNumber?: string | null;
  buyerTaxOffice?: string | null;
  buyerAddress?: string | null;
  totalGross: number;
  currency?: 'TRY' | 'USD' | 'EUR';
  lines: Array<{
    description: string;
    quantity: number;
    unitPriceGross: number;
  }>;
}

export async function createSaleInvoice(input: CreateSaleInvoiceInput) {
  const existing = await prisma.invoice.findFirst({
    where: { orderId: input.orderId, status: 'issued' }
  });
  if (existing) return existing;

  const tax = splitGrossAmount(input.totalGross);
  const invoiceNumber = await nextInvoiceNumber();
  const type = resolveInvoiceType(input.buyerTaxNumber);

  const invoice = await prisma.invoice.create({
    data: {
      orderId: input.orderId,
      userId: input.userId,
      invoiceNumber,
      type,
      status: 'issued',
      buyerName: input.buyerName,
      buyerTaxNumber: input.buyerTaxNumber ?? null,
      buyerTaxOffice: input.buyerTaxOffice ?? null,
      buyerAddress: input.buyerAddress ?? null,
      subtotalNet: tax.subtotalNet,
      vatRate: tax.vatRate,
      vatAmount: tax.vatAmount,
      totalGross: tax.totalGross,
      currency: input.currency ?? 'TRY',
      metadata: {
        seller: {
          tradeName: companyLegal.tradeName,
          taxNumber: companyLegal.taxNumber,
          taxOffice: companyLegal.taxOffice,
          address: companyLegal.address
        }
      },
      lines: {
        create: input.lines.map((line) => {
          const lineTax = splitGrossAmount(line.unitPriceGross * line.quantity);
          const unitNet =
            Math.round((lineTax.subtotalNet / line.quantity) * 100) / 100;
          return {
            description: line.description,
            quantity: line.quantity,
            unitPriceNet: unitNet,
            vatRate: lineTax.vatRate,
            vatAmount: lineTax.vatAmount,
            totalGross: lineTax.totalGross
          };
        })
      }
    },
    include: { lines: true }
  });

  await logAccountingAudit({
    action: 'invoice.issued',
    entityType: 'invoice',
    entityId: invoice.id,
    after: { invoiceNumber, orderId: input.orderId, totalGross: tax.totalGross }
  });

  return invoice;
}

export async function createCreditNoteForRefund(orderId: string) {
  const original = await prisma.invoice.findFirst({
    where: { orderId, status: 'issued', type: { not: 'credit_note' } },
    include: { lines: true }
  });
  if (!original) return null;

  const invoiceNumber = await nextInvoiceNumber();

  const credit = await prisma.invoice.create({
    data: {
      orderId,
      userId: original.userId,
      invoiceNumber,
      type: 'credit_note',
      status: 'issued',
      buyerName: original.buyerName,
      buyerTaxNumber: original.buyerTaxNumber,
      buyerTaxOffice: original.buyerTaxOffice,
      buyerAddress: original.buyerAddress,
      subtotalNet: -original.subtotalNet,
      vatRate: original.vatRate,
      vatAmount: -original.vatAmount,
      totalGross: -original.totalGross,
      currency: original.currency,
      metadata: {
        originalInvoiceId: original.id,
        originalInvoiceNumber: original.invoiceNumber
      },
      lines: {
        create: original.lines.map((line) => ({
          description: `İade: ${line.description}`,
          quantity: line.quantity,
          unitPriceNet: -line.unitPriceNet,
          vatRate: line.vatRate,
          vatAmount: -line.vatAmount,
          totalGross: -line.totalGross
        }))
      }
    }
  });

  await logAccountingAudit({
    action: 'invoice.cancelled',
    entityType: 'invoice',
    entityId: credit.id,
    after: { creditNote: invoiceNumber, originalInvoice: original.invoiceNumber }
  });

  // GİB kredi notu / iptal — failSoft; sipariş iadesini engellemez
  try {
    const { submitInvoiceToGib } = await import('@/lib/accounting/einvoice');
    await submitInvoiceToGib({ invoiceId: credit.id });
  } catch {
    // ignore — audit submit içinde
  }

  return credit;
}

/** GİB başarıyla gönderilmiş / imzalanmış faturalarda tarih düzeltilemez */
export function canEditInvoiceIssuedAt(
  gibStatus: string | null | undefined
): boolean {
  const s = (gibStatus ?? '').trim();
  if (!s || s === '—' || s === 'none') return true;
  return (
    s === 'failed' ||
    s === 'rejected' ||
    s === 'skipped' ||
    s === 'pending' ||
    s === 'draft'
  );
}

/**
 * Admin: fatura issuedAt düzeltmesi (GEÇİŞ penceresine taşımak için).
 * Yalnızca GİB status draft/error/none iken.
 */
export async function updateInvoiceIssuedAt(params: {
  invoiceId: string;
  issuedAt: Date;
  actorId?: string | null;
}): Promise<{ id: string; issuedAt: Date }> {
  await ensureDbConnection();

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    select: { id: true, issuedAt: true, metadata: true, eInvoiceUuid: true }
  });
  if (!invoice) {
    throw new Error('Fatura bulunamadı');
  }

  const einv = readEInvoiceMeta(invoice.metadata);
  const gibStatus =
    einv.status ?? (invoice.eInvoiceUuid ? 'submitted' : undefined);
  if (!canEditInvoiceIssuedAt(gibStatus)) {
    throw new Error(
      'GİB’e gönderilmiş veya onaylı faturada tarih değiştirilemez'
    );
  }

  if (Number.isNaN(params.issuedAt.getTime())) {
    throw new Error('Geçersiz fatura tarihi');
  }

  const updated = await prisma.invoice.update({
    where: { id: params.invoiceId },
    data: { issuedAt: params.issuedAt },
    select: { id: true, issuedAt: true }
  });

  await logAccountingAudit({
    action: 'invoice.issuedAt.updated',
    entityType: 'invoice',
    entityId: invoice.id,
    actorId: params.actorId,
    actorRole: 'admin',
    before: { issuedAt: invoice.issuedAt.toISOString() },
    after: { issuedAt: updated.issuedAt.toISOString() }
  });

  return updated;
}
