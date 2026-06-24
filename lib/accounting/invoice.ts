import type { InvoiceType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { companyLegal } from '@/lib/config/company';
import { splitGrossAmount } from '@/lib/accounting/tax';
import { logAccountingAudit } from '@/lib/accounting/audit';

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

function resolveInvoiceType(buyerTaxNumber?: string | null): InvoiceType {
  if (buyerTaxNumber && buyerTaxNumber.length === 10) return 'e_fatura';
  return 'e_arsiv';
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
      metadata: { originalInvoiceId: original.id },
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

  return credit;
}
