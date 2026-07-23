import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getEInvoiceConfig } from '@/lib/accounting/einvoice/config';
import { resolveProviderForKind } from '@/lib/accounting/einvoice/provider';
import { readEInvoiceMeta } from '@/lib/accounting/einvoice/meta';
import {
  generateInvoicePdf,
  buildInvoicePdfFilename,
  type InvoicePdfInput
} from '@/lib/accounting/einvoice/invoice-pdf';
import {
  LIFECYCLE_LABELS,
  resolveLifecycleStatus
} from '@/lib/accounting/einvoice/lifecycle';
import type { EInvoiceDocumentKind } from '@/lib/accounting/einvoice/types';

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

function mapKind(type: string): EInvoiceDocumentKind {
  if (type === 'e_fatura') return 'e_fatura';
  if (type === 'credit_note') return 'credit_note';
  return 'e_arsiv';
}

export type InvoicePdfDownloadResult =
  | {
      ok: true;
      source: 'channel' | 'local';
      buffer: Buffer;
      filename: string;
      contentType: 'application/pdf';
      redirectUrl?: never;
    }
  | {
      ok: true;
      source: 'channel_url';
      redirectUrl: string;
      filename: string;
      buffer?: never;
      contentType?: never;
    }
  | { ok: false; error: string };

/**
 * Önce kanaldan PDF dene; yoksa / mock’ta dahili pdfkit üret.
 */
export async function downloadInvoicePdf(
  invoiceId: string
): Promise<InvoicePdfDownloadResult> {
  await ensureDbConnection();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true }
  });
  if (!invoice) {
    return { ok: false, error: 'Fatura bulunamadı' };
  }

  const einv = readEInvoiceMeta(invoice.metadata);
  const uuid = invoice.eInvoiceUuid ?? einv.uuid ?? null;
  const filename = buildInvoicePdfFilename(invoice.invoiceNumber);
  const kind = mapKind(invoice.type);
  const config = getEInvoiceConfig();
  const provider = resolveProviderForKind(kind, config);

  if (uuid && provider) {
    const getPdf = provider.downloadPdf ?? provider.getPdf;
    if (getPdf) {
      try {
        const channel = await getPdf(uuid, {
          signed: einv.status === 'accepted' && !einv.needsSmsSign
        });
        if (channel.ok && channel.pdfBase64) {
          return {
            ok: true,
            source: 'channel',
            buffer: Buffer.from(channel.pdfBase64, 'base64'),
            filename,
            contentType: 'application/pdf'
          };
        }
        if (channel.ok && channel.pdfUrl) {
          // GİB portal URL’leri oturum token’ı içerir — tarayıcıya yönlendir
          if (
            channel.pdfUrl.includes('earsivportal') ||
            channel.pdfUrl.startsWith('http')
          ) {
            return {
              ok: true,
              source: 'channel_url',
              redirectUrl: channel.pdfUrl,
              filename
            };
          }
        }
      } catch {
        // local fallback
      }
    }
  }

  const lifecycle = resolveLifecycleStatus({
    invoiceStatus: invoice.status,
    einvoice: einv,
    eInvoiceUuid: invoice.eInvoiceUuid
  });

  const pdfInput: InvoicePdfInput = {
    invoiceNumber: invoice.invoiceNumber,
    type: invoice.type,
    status: invoice.status,
    issuedAt: invoice.issuedAt,
    buyerName: invoice.buyerName,
    buyerTaxNumber: invoice.buyerTaxNumber,
    buyerTaxOffice: invoice.buyerTaxOffice,
    buyerAddress: invoice.buyerAddress,
    subtotalNet: invoice.subtotalNet,
    vatRate: invoice.vatRate,
    vatAmount: invoice.vatAmount,
    totalGross: invoice.totalGross,
    currency: invoice.currency,
    eInvoiceUuid: invoice.eInvoiceUuid,
    ettn: typeof einv.ettn === 'string' ? einv.ettn : null,
    channel: typeof einv.channel === 'string' ? einv.channel : null,
    envelopeUuid:
      typeof einv.envelopeUuid === 'string' ? einv.envelopeUuid : null,
    lifecycleLabel: LIFECYCLE_LABELS[lifecycle],
    originalInvoiceNumber:
      typeof asRecord(invoice.metadata).originalInvoiceNumber === 'string'
        ? (asRecord(invoice.metadata).originalInvoiceNumber as string)
        : null,
    lines: invoice.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPriceNet: l.unitPriceNet,
      vatRate: l.vatRate,
      vatAmount: l.vatAmount,
      totalGross: l.totalGross
    }))
  };

  const buffer = await generateInvoicePdf(pdfInput);
  return {
    ok: true,
    source: 'local',
    buffer,
    filename,
    contentType: 'application/pdf'
  };
}
