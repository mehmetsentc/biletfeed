import {
  getParasutConfig,
  isParasutConfigured,
  type ParasutConfig
} from '@/lib/accounting/einvoice/parasut/config';
import { ensureContact } from '@/lib/accounting/einvoice/parasut/contacts';
import {
  createEDocumentFromSalesInvoice,
  extractJobResultId,
  findEInvoiceInboxAddress,
  getEDocumentPdfUrl,
  shareSalesInvoiceEmail,
  showEDocument,
  waitTrackableJob
} from '@/lib/accounting/einvoice/parasut/e-documents';
import { ensureProductId } from '@/lib/accounting/einvoice/parasut/products';
import {
  createSalesInvoice,
  salesInvoiceNo,
  showSalesInvoice
} from '@/lib/accounting/einvoice/parasut/sales-invoices';
import { queryTaxpayerHeuristic } from '@/lib/accounting/einvoice/taxpayer';
import type {
  EInvoicePayload,
  EInvoiceProvider,
  EInvoiceSubmitResult
} from '@/lib/accounting/einvoice/types';

function parseProviderRef(ref: string | undefined): {
  salesInvoiceId?: string;
  eDocumentId?: string;
  documentType?: 'e_archives' | 'e_invoices';
} {
  if (!ref) return {};
  // format: sales:{id}|edoc:{type}:{id}
  const parts = ref.split('|');
  const out: {
    salesInvoiceId?: string;
    eDocumentId?: string;
    documentType?: 'e_archives' | 'e_invoices';
  } = {};
  for (const p of parts) {
    if (p.startsWith('sales:')) out.salesInvoiceId = p.slice(6);
    if (p.startsWith('edoc:')) {
      const [, type, id] = p.split(':');
      if (
        (type === 'e_archives' || type === 'e_invoices') &&
        id
      ) {
        out.documentType = type;
        out.eDocumentId = id;
      }
    }
  }
  return out;
}

export function createParasutEInvoiceProvider(
  config: ParasutConfig = getParasutConfig()
): EInvoiceProvider {
  if (!isParasutConfigured(config)) {
    throw new Error(
      'Paraşüt yapılandırılmamış — PARASUT_CLIENT_ID/SECRET/USERNAME/PASSWORD/COMPANY_ID'
    );
  }

  const provider: EInvoiceProvider = {
    name: 'parasut',
    supports: ['e_arsiv', 'e_fatura'],
    channelId: 'parasut',

    async submit(payload: EInvoicePayload): Promise<EInvoiceSubmitResult> {
      try {
        const contactId = await ensureContact(config, payload.buyer);
        const productId = await ensureProductId(config);

        const itemType =
          payload.kind === 'credit_note' ? 'refund' : 'invoice';
        const salesInvoice = await createSalesInvoice(config, {
          payload,
          contactId,
          productId,
          itemType
        });

        let eInvoiceTo: string | null = null;
        if (payload.kind === 'e_fatura' && payload.buyer.taxNumber) {
          eInvoiceTo = await findEInvoiceInboxAddress(
            config,
            payload.buyer.taxNumber
          );
        }

        // e-Fatura isteniyor ama inbox yoksa e-Arşiv'e düş (Paraşüt davranışına yakın)
        const effectiveKind =
          payload.kind === 'e_fatura' && !eInvoiceTo
            ? 'e_arsiv'
            : payload.kind === 'credit_note'
              ? 'e_arsiv'
              : payload.kind;

        const { job, documentType } = await createEDocumentFromSalesInvoice(
          config,
          {
            salesInvoiceId: salesInvoice.id,
            kind: effectiveKind,
            eInvoiceTo
          }
        );

        const finished = await waitTrackableJob(config, job.id);
        let eDocumentId =
          extractJobResultId(finished) ??
          (finished.type === documentType ? finished.id : null);

        // result bazen sales_invoice üzerinde active_e_document
        if (!eDocumentId) {
          const refreshed = await showSalesInvoice(config, salesInvoice.id);
          const rel = refreshed?.relationships?.active_e_document as
            | { data?: { id?: string; type?: string } }
            | undefined;
          if (rel?.data?.id) eDocumentId = rel.data.id;
        }

        let pdfUrl: string | undefined;
        if (eDocumentId) {
          pdfUrl =
            (await getEDocumentPdfUrl(config, documentType, eDocumentId)) ??
            undefined;
          if (!pdfUrl) {
            const shown = await showEDocument(
              config,
              documentType,
              eDocumentId
            );
            const u = shown?.attributes?.pdf_url ?? shown?.attributes?.url;
            if (typeof u === 'string') pdfUrl = u;
          }
        }

        const email = payload.buyer.email?.trim();
        if (email) {
          try {
            await shareSalesInvoiceEmail(config, {
              salesInvoiceId: salesInvoice.id,
              email,
              subject: `Faturanız — ${payload.invoiceNumber}`,
              body: `Merhaba ${payload.buyer.name},\n\nBiletFeed faturanız (${payload.invoiceNumber}) ektedir.`
            });
          } catch (shareErr) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn(
                '[parasut] share email failed',
                shareErr instanceof Error ? shareErr.message : shareErr
              );
            }
          }
        }

        const invoiceNo = salesInvoiceNo(salesInvoice);
        const providerRef = [
          `sales:${salesInvoice.id}`,
          eDocumentId ? `edoc:${documentType}:${eDocumentId}` : null
        ]
          .filter(Boolean)
          .join('|');

        return {
          ok: true,
          status: 'accepted',
          uuid: eDocumentId ?? salesInvoice.id,
          ettn: payload.ettn,
          pdfUrl,
          providerRef,
          dispatchStatus: 'accepted',
          raw: {
            salesInvoiceId: salesInvoice.id,
            invoiceNo,
            documentType,
            eDocumentId,
            effectiveKind
          }
        };
      } catch (err) {
        return {
          ok: false,
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
          dispatchStatus: 'error'
        };
      }
    },

    async createDraft(payload) {
      return provider.submit(payload);
    },

    async send(payload) {
      return provider.submit(payload);
    },

    async getStatus(uuid: string): Promise<EInvoiceSubmitResult> {
      // uuid may be e-doc id or sales id — try sales first
      try {
        const inv = await showSalesInvoice(config, uuid);
        if (inv) {
          return {
            ok: true,
            status: 'accepted',
            uuid,
            providerRef: `sales:${uuid}`,
            dispatchStatus: 'accepted'
          };
        }
      } catch {
        // ignore
      }
      return {
        ok: true,
        status: 'submitted',
        uuid,
        dispatchStatus: 'sent'
      };
    },

    async getPdf(uuid: string) {
      const parsed = parseProviderRef(uuid);
      if (parsed.documentType && parsed.eDocumentId) {
        const url = await getEDocumentPdfUrl(
          config,
          parsed.documentType,
          parsed.eDocumentId
        );
        if (url) return { ok: true, pdfUrl: url };
      }
      // Try both document collections
      for (const type of ['e_archives', 'e_invoices'] as const) {
        try {
          const url = await getEDocumentPdfUrl(config, type, uuid);
          if (url) return { ok: true, pdfUrl: url };
        } catch {
          // continue
        }
      }
      return { ok: false, error: 'Paraşüt PDF bulunamadı' };
    },

    async downloadPdf(uuid, opts) {
      return (
        (await provider.getPdf?.(uuid, opts)) ?? {
          ok: false,
          error: 'Paraşüt PDF yok'
        }
      );
    },

    async queryTaxpayer(taxId: string) {
      const heuristic = queryTaxpayerHeuristic(taxId);
      const digits = taxId.replace(/\D/g, '');
      if (digits.length === 10) {
        const inbox = await findEInvoiceInboxAddress(config, digits);
        if (inbox) {
          return {
            ...heuristic,
            efaturaUser: 'yes' as const,
            suggestedDocumentType: 'e_fatura' as const,
            source: 'gib' as const,
            note: 'Paraşüt e_invoice_inboxes'
          };
        }
      }
      return heuristic;
    }
  };

  return provider;
}
