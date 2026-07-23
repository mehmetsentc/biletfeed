import type { EInvoiceConfig } from '@/lib/accounting/einvoice/config';
import type {
  EInvoicePayload,
  EInvoiceProvider,
  EInvoiceSubmitResult
} from '@/lib/accounting/einvoice/types';

/**
 * Genel REST entegratör köprüsü.
 * Endpoint yolları env ile özelleştirilebilir; API dokümanı gelince mapping netleştirilir.
 *
 * Varsayılanlar (çoğu SaaS entegratörüne yakın):
 *   POST {base}/invoices
 *   GET  {base}/invoices/{uuid}
 *   GET  {base}/invoices/{uuid}/pdf
 */
export function createHttpEInvoiceProvider(config: EInvoiceConfig): EInvoiceProvider {
  const submitPath = process.env.EINVOICE_SUBMIT_PATH ?? '/invoices';
  const statusPathTpl =
    process.env.EINVOICE_STATUS_PATH ?? '/invoices/{uuid}';
  const pdfPathTpl = process.env.EINVOICE_PDF_PATH ?? '/invoices/{uuid}/pdf';

  function authHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };
    if (config.apiKey) {
      headers.Authorization = `Bearer ${config.apiKey}`;
    }
    if (config.username && config.password) {
      const basic = Buffer.from(
        `${config.username}:${config.password}`,
        'utf8'
      ).toString('base64');
      headers.Authorization = `Basic ${basic}`;
    }
    return headers;
  }

  async function parseJson(res: Response): Promise<Record<string, unknown>> {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { rawText: text };
    }
  }

  function pickString(
    obj: Record<string, unknown>,
    keys: string[]
  ): string | undefined {
    for (const key of keys) {
      const v = obj[key];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return undefined;
  }

  return {
    name: 'http',
    supports: ['e_arsiv', 'e_fatura'],
    channelId: 'http',

    async submit(payload: EInvoicePayload): Promise<EInvoiceSubmitResult> {
      if (!config.apiBaseUrl) {
        return {
          ok: false,
          status: 'failed',
          error: 'EINVOICE_API_BASE_URL tanımlı değil'
        };
      }

      const body = {
        ettn: payload.ettn,
        invoiceNumber: payload.invoiceNumber,
        documentType: payload.kind,
        issueDate: payload.issuedAt.toISOString(),
        currency: payload.currency,
        subtotalNet: payload.subtotalNet,
        vatRate: payload.vatRate,
        vatAmount: payload.vatAmount,
        totalGross: payload.totalGross,
        seller: payload.seller,
        buyer: payload.buyer,
        lines: payload.lines,
        originalEttn: payload.originalEttn,
        originalInvoiceNumber: payload.originalInvoiceNumber,
        ublXml: payload.ublXml,
        sandbox: config.sandbox
      };

      try {
        const res = await fetch(`${config.apiBaseUrl}${submitPath}`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(body)
        });
        const data = await parseJson(res);
        const uuid =
          pickString(data, ['uuid', 'ettn', 'id', 'documentId', 'gibUuid']) ??
          payload.ettn;

        if (!res.ok) {
          const errMsg =
            pickString(data, ['error', 'message', 'detail']) ??
            `HTTP ${res.status}`;
          return {
            ok: false,
            status: 'rejected',
            uuid,
            ettn: payload.ettn,
            error: errMsg,
            raw: data
          };
        }

        return {
          ok: true,
          status: 'submitted',
          uuid,
          ettn: payload.ettn,
          pdfUrl: pickString(data, ['pdfUrl', 'pdf_url', 'documentUrl']),
          providerRef: pickString(data, ['providerRef', 'reference', 'ref']),
          raw: data
        };
      } catch (err) {
        return {
          ok: false,
          status: 'failed',
          ettn: payload.ettn,
          error: err instanceof Error ? err.message : String(err)
        };
      }
    },

    async getStatus(uuid: string): Promise<EInvoiceSubmitResult> {
      if (!config.apiBaseUrl) {
        return { ok: false, status: 'failed', error: 'API base URL yok' };
      }
      const path = statusPathTpl.replace('{uuid}', encodeURIComponent(uuid));
      try {
        const res = await fetch(`${config.apiBaseUrl}${path}`, {
          headers: authHeaders()
        });
        const data = await parseJson(res);
        if (!res.ok) {
          return {
            ok: false,
            status: 'failed',
            uuid,
            error: pickString(data, ['error', 'message']) ?? `HTTP ${res.status}`,
            raw: data
          };
        }
        const statusRaw = (
          pickString(data, ['status', 'state']) ?? 'accepted'
        ).toLowerCase();
        const status =
          statusRaw.includes('reject') || statusRaw.includes('fail')
            ? 'rejected'
            : statusRaw.includes('pend') || statusRaw.includes('wait')
              ? 'pending'
              : statusRaw.includes('submit')
                ? 'submitted'
                : 'accepted';
        return {
          ok: true,
          status,
          uuid,
          ettn: pickString(data, ['ettn', 'uuid']),
          pdfUrl: pickString(data, ['pdfUrl', 'pdf_url']),
          raw: data
        };
      } catch (err) {
        return {
          ok: false,
          status: 'failed',
          uuid,
          error: err instanceof Error ? err.message : String(err)
        };
      }
    },

    async getPdf(uuid: string) {
      if (!config.apiBaseUrl) {
        return { ok: false, error: 'API base URL yok' };
      }
      const path = pdfPathTpl.replace('{uuid}', encodeURIComponent(uuid));
      try {
        const res = await fetch(`${config.apiBaseUrl}${path}`, {
          headers: authHeaders()
        });
        if (!res.ok) {
          return { ok: false, error: `HTTP ${res.status}` };
        }
        const contentType = res.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          const data = await parseJson(res);
          return {
            ok: true,
            pdfUrl: pickString(data, ['pdfUrl', 'pdf_url', 'url']),
            pdfBase64: pickString(data, ['pdfBase64', 'content', 'base64'])
          };
        }
        const buf = Buffer.from(await res.arrayBuffer());
        return { ok: true, pdfBase64: buf.toString('base64') };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        };
      }
    }
  };
}
