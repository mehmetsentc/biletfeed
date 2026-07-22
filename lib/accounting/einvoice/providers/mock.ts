import type {
  EInvoicePayload,
  EInvoiceProvider,
  EInvoiceSubmitResult
} from '@/lib/accounting/einvoice/types';

/** Credential yokken / lokal geliştirmede GİB simülasyonu */
export function createMockEInvoiceProvider(): EInvoiceProvider {
  return {
    name: 'mock',
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
        raw: { mock: true, needsSmsSign: false }
      };
    },
    async getStatus(uuid: string): Promise<EInvoiceSubmitResult> {
      return { ok: true, status: 'accepted', uuid, ettn: uuid };
    },
    async getPdf(uuid: string) {
      return {
        ok: false,
        error: `Mock provider PDF üretmez (${uuid.slice(0, 8)}…)`
      };
    },
    async startSmsSign() {
      return { ok: true, oid: `mock-oid-${Date.now()}`, phoneMasked: '555****00' };
    },
    async completeSmsSign() {
      return { ok: true };
    }
  };
}
