import { queryTaxpayerHeuristic } from '@/lib/accounting/einvoice/taxpayer';
import type {
  EInvoicePayload,
  EInvoiceProvider,
  EInvoiceSubmitResult
} from '@/lib/accounting/einvoice/types';

/** Credential yokken / lokal geliştirmede GİB simülasyonu — Paraşüt parity ops */
export function createMockEInvoiceProvider(): EInvoiceProvider {
  const provider: EInvoiceProvider = {
    name: 'mock',
    supports: ['e_arsiv', 'e_fatura'],
    channelId: 'mock',
    async submit(payload: EInvoicePayload): Promise<EInvoiceSubmitResult> {
      const uuid = payload.ettn;
      if (process.env.NODE_ENV !== 'production') {
        console.info('[einvoice:mock] submit', {
          invoiceNumber: payload.invoiceNumber,
          kind: payload.kind,
          ettn: uuid,
          totalGross: payload.totalGross
        });
      }
      return {
        ok: true,
        status: 'accepted',
        uuid,
        ettn: uuid,
        providerRef: `mock-${uuid.slice(0, 8)}`,
        dispatchStatus: 'accepted',
        raw: { mock: true, needsSmsSign: false }
      };
    },
    async createDraft(payload) {
      const r = await provider.submit(payload);
      return {
        ...r,
        status: 'submitted',
        dispatchStatus: 'queued',
        raw: { mock: true, needsSmsSign: payload.kind === 'e_arsiv' }
      };
    },
    async send(payload) {
      return provider.submit(payload);
    },
    async submitDraft(payload) {
      return provider.createDraft?.(payload) ?? provider.submit(payload);
    },
    async getStatus(uuid: string): Promise<EInvoiceSubmitResult> {
      return {
        ok: true,
        status: 'accepted',
        uuid,
        ettn: uuid,
        dispatchStatus: 'accepted'
      };
    },
    async getPdf(uuid: string) {
      // Mock PDF yok — download-pdf yerel üretir
      return {
        ok: false,
        error: `Mock kanal PDF vermez — yerel PDF kullanılacak (${uuid.slice(0, 8)}…)`
      };
    },
    async downloadPdf(uuid, opts) {
      return provider.getPdf?.(uuid, opts) ?? {
        ok: false,
        error: 'Mock PDF yok'
      };
    },
    async startSmsSign() {
      return {
        ok: true,
        oid: `mock-oid-${Date.now()}`,
        phoneMasked: '555****00'
      };
    },
    async completeSmsSign() {
      return { ok: true };
    },
    async signSmsStart(ettns) {
      return provider.startSmsSign?.(ettns) ?? { ok: false, error: 'SMS yok' };
    },
    async signSmsComplete(params) {
      return provider.completeSmsSign?.(params) ?? { ok: false, error: 'SMS yok' };
    },
    async cancel(uuid) {
      if (process.env.NODE_ENV !== 'production') {
        console.info('[einvoice:mock] cancel', uuid.slice(0, 8));
      }
      return { ok: true, mock: true };
    },
    async queryTaxpayer(taxId: string) {
      const r = queryTaxpayerHeuristic(taxId);
      return { ...r, source: 'heuristic' as const };
    }
  };
  return provider;
}
