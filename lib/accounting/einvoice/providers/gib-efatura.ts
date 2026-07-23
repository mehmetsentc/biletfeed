import { createHash, randomUUID } from 'crypto';
import type {
  EFaturaChannelConfig,
  EInvoiceConfig
} from '@/lib/accounting/einvoice/config';
import { queryTaxpayerHeuristic } from '@/lib/accounting/einvoice/taxpayer';
import type {
  EInvoicePayload,
  EInvoiceProvider,
  EInvoiceSubmitResult
} from '@/lib/accounting/einvoice/types';

/**
 * BiletFeed kendi e-Fatura integrator iskeleti.
 *
 * - UBL-TR XML payload.ublXml üzerinden taşınır (mevcut builder).
 * - Yapılandırılmış endpoint’e HTTP POST; yoksa / mock modda yerel simülasyon.
 * - GİB özel entegratör lisansı bu kodun varlığıyla kazanılmaz; canlı gönderim
 *   sertifikalı uç nokta + yasal süreç gerektirir.
 */
export function createGibEfaturaProvider(
  config: EInvoiceConfig
): EInvoiceProvider {
  const ch = config.efatura;

  function authHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };
    if (ch.apiKey) {
      headers.Authorization = `Bearer ${ch.apiKey}`;
    } else if (ch.username && ch.password) {
      const basic = Buffer.from(
        `${ch.username}:${ch.password}`,
        'utf8'
      ).toString('base64');
      headers.Authorization = `Basic ${basic}`;
    }
    return headers;
  }

  function pathWithUuid(tpl: string, uuid: string): string {
    return tpl.replace('{uuid}', encodeURIComponent(uuid));
  }

  function payloadHash(payload: EInvoicePayload): string {
    return createHash('sha256')
      .update(payload.ublXml || payload.invoiceNumber + payload.ettn)
      .digest('hex')
      .slice(0, 32);
  }

  async function parseJson(res: Response): Promise<Record<string, unknown>> {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { rawText: text, httpStatus: res.status };
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

  async function mockSubmit(
    payload: EInvoicePayload
  ): Promise<EInvoiceSubmitResult> {
    const hash = payloadHash(payload);
    const envelopeUuid = randomUUID();
    if (process.env.NODE_ENV !== 'production') {
      console.info('[einvoice:gib-efatura:mock] submit', {
        invoiceNumber: payload.invoiceNumber,
        ettn: payload.ettn,
        envelopeUuid,
        payloadHash: hash
      });
    }
    return {
      ok: true,
      status: 'submitted',
      uuid: payload.ettn,
      ettn: payload.ettn,
      providerRef: `bf-efatura-mock-${payload.ettn.slice(0, 8)}`,
      dispatchStatus: 'sent',
      envelopeUuid,
      payloadHash: hash,
      raw: { mock: true, channel: 'gib-efatura' }
    };
  }

  async function httpSubmit(
    payload: EInvoicePayload
  ): Promise<EInvoiceSubmitResult> {
    if (!ch.baseUrl) {
      return {
        ok: false,
        status: 'failed',
        error:
          'EINVOICE_EFATURA_BASE_URL tanımlı değil — e-Fatura kanalı endpoint bekliyor',
        dispatchStatus: 'pending_channel'
      };
    }

    const hash = payloadHash(payload);
    const body = {
      channel: 'gib-efatura',
      documentType: 'e_fatura',
      ettn: payload.ettn,
      invoiceNumber: payload.invoiceNumber,
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
      payloadHash: hash,
      sandbox: config.sandbox
    };

    try {
      const res = await fetch(`${ch.baseUrl}${ch.submitPath}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body)
      });
      const data = await parseJson(res);
      const uuid =
        pickString(data, ['uuid', 'ettn', 'documentUuid', 'id']) ?? payload.ettn;
      const envelopeUuid = pickString(data, [
        'envelopeUuid',
        'envelopeId',
        'zarfUuid'
      ]);

      if (!res.ok) {
        const err =
          pickString(data, ['error', 'message', 'faultString']) ||
          `e-Fatura kanalı HTTP ${res.status}`;
        return {
          ok: false,
          status: 'rejected',
          error: err,
          dispatchStatus: 'rejected',
          envelopeUuid,
          payloadHash: hash,
          raw: data
        };
      }

      const statusRaw = pickString(data, ['status'])?.toLowerCase();
      const status =
        statusRaw === 'accepted'
          ? 'accepted'
          : statusRaw === 'rejected'
            ? 'rejected'
            : 'submitted';

      return {
        ok: status !== 'rejected',
        status,
        uuid,
        ettn: pickString(data, ['ettn']) ?? payload.ettn,
        providerRef: pickString(data, ['providerRef', 'ref']),
        pdfUrl: pickString(data, ['pdfUrl']),
        dispatchStatus: status === 'accepted' ? 'accepted' : 'sent',
        envelopeUuid,
        payloadHash: hash,
        raw: data
      };
    } catch (err) {
      return {
        ok: false,
        status: 'failed',
        error:
          err instanceof Error
            ? `e-Fatura kanalı bağlantı hatası: ${err.message}`
            : 'e-Fatura kanalı bağlantı hatası',
        dispatchStatus: 'error',
        payloadHash: hash
      };
    }
  }

  const provider: EInvoiceProvider = {
    name: 'gib-efatura',
    supports: ['e_fatura'],
    channelId: 'gib-efatura',

    async submit(payload: EInvoicePayload): Promise<EInvoiceSubmitResult> {
      if (payload.kind !== 'e_fatura' && payload.kind !== 'credit_note') {
        return {
          ok: false,
          status: 'failed',
          error:
            'gib-efatura yalnızca e_fatura / credit_note taşır; e-Arşiv için gib-earsiv kullanın',
          dispatchStatus: 'error'
        };
      }

      if (!ch.enabled && !ch.mock) {
        return {
          ok: false,
          status: 'failed',
          error:
            'e-Fatura gönderimi için entegratör/kanal yapılandırılmadı',
          dispatchStatus: 'pending_channel'
        };
      }

      if (ch.mock || !ch.baseUrl) {
        return mockSubmit(payload);
      }

      return httpSubmit(payload);
    },

    async submitDraft(payload) {
      return provider.createDraft?.(payload) ?? provider.submit(payload);
    },

    async createDraft(payload) {
      const result = await provider.submit(payload);
      if (!result.ok) return result;
      return {
        ...result,
        status: 'submitted',
        dispatchStatus: result.dispatchStatus ?? 'queued'
      };
    },

    async send(payload) {
      return provider.submit(payload);
    },

    async getStatus(uuid: string): Promise<EInvoiceSubmitResult> {
      if (ch.mock || !ch.baseUrl) {
        return {
          ok: true,
          status: 'submitted',
          uuid,
          ettn: uuid,
          dispatchStatus: 'sent',
          raw: { mock: true }
        };
      }
      try {
        const res = await fetch(
          `${ch.baseUrl}${pathWithUuid(ch.statusPath, uuid)}`,
          { headers: authHeaders() }
        );
        const data = await parseJson(res);
        if (!res.ok) {
          return {
            ok: false,
            status: 'failed',
            error:
              pickString(data, ['error', 'message']) ||
              `Durum sorgusu HTTP ${res.status}`,
            uuid,
            dispatchStatus: 'error',
            raw: data
          };
        }
        const statusRaw = pickString(data, ['status'])?.toLowerCase();
        const status =
          statusRaw === 'accepted'
            ? 'accepted'
            : statusRaw === 'rejected'
              ? 'rejected'
              : 'submitted';
        return {
          ok: true,
          status,
          uuid,
          ettn: pickString(data, ['ettn']) ?? uuid,
          dispatchStatus:
            status === 'accepted'
              ? 'accepted'
              : status === 'rejected'
                ? 'rejected'
                : 'sent',
          raw: data
        };
      } catch (err) {
        return {
          ok: false,
          status: 'failed',
          uuid,
          error: err instanceof Error ? err.message : 'Durum sorgusu başarısız',
          dispatchStatus: 'error'
        };
      }
    },

    async cancel(uuid: string, opts?: { reason?: string }) {
      // Mock / endpoint yok: yerel iptal işaretine izin ver (Paraşüt UI parity)
      if (ch.mock || !ch.baseUrl) {
        if (process.env.NODE_ENV !== 'production') {
          console.info('[einvoice:gib-efatura:mock] cancel', {
            uuid: uuid.slice(0, 8),
            reason: opts?.reason
          });
        }
        return { ok: true, mock: true };
      }
      try {
        const res = await fetch(
          `${ch.baseUrl}${pathWithUuid(ch.cancelPath, uuid)}`,
          {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ reason: opts?.reason ?? 'cancel' })
          }
        );
        if (!res.ok) {
          const data = await parseJson(res);
          return {
            ok: false,
            error:
              pickString(data, ['error', 'message']) ||
              `İptal HTTP ${res.status}`
          };
        }
        return { ok: true, mock: false };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'İptal başarısız'
        };
      }
    },

    async queryTaxpayer(taxId: string) {
      return queryTaxpayerHeuristic(taxId);
    },

    async startSmsSign() {
      return {
        ok: false,
        error: 'e-Fatura kanalında SMS imza (e-Arşiv portal) kullanılmaz'
      };
    },
    async completeSmsSign() {
      return {
        ok: false,
        error: 'e-Fatura kanalında SMS imza kullanılmaz'
      };
    },
    async signSmsStart(ettns) {
      return provider.startSmsSign?.(ettns) ?? { ok: false, error: 'SMS yok' };
    },
    async signSmsComplete(params) {
      return (
        provider.completeSmsSign?.(params) ?? { ok: false, error: 'SMS yok' }
      );
    },

    async getPdf(uuid, opts) {
      return provider.downloadPdf?.(uuid, opts) ?? {
        ok: false,
        error: 'PDF indirme yapılandırılmadı'
      };
    },

    async downloadPdf(uuid: string) {
      if (ch.mock || !ch.baseUrl) {
        return {
          ok: false,
          error: `e-Fatura PDF mock kanalda üretilmez (${uuid.slice(0, 8)}…)`
        };
      }
      try {
        const res = await fetch(
          `${ch.baseUrl}${pathWithUuid(ch.pdfPath, uuid)}`,
          { headers: authHeaders() }
        );
        const data = await parseJson(res);
        if (!res.ok) {
          return {
            ok: false,
            error:
              pickString(data, ['error', 'message']) ||
              `PDF HTTP ${res.status}`
          };
        }
        return {
          ok: true,
          pdfUrl: pickString(data, ['pdfUrl', 'url']),
          pdfBase64: pickString(data, ['pdfBase64', 'content'])
        };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'PDF indirme başarısız'
        };
      }
    }
  };

  return provider;
}

/** Yapılandırma özeti — panel banner / health */
export function summarizeEfaturaChannel(ch: EFaturaChannelConfig): string {
  if (!ch.enabled) {
    return 'Kapalı (EINVOICE_EFATURA_ENABLED≠true)';
  }
  if (ch.mock || !ch.baseUrl) {
    return 'Açık — mock (endpoint yok veya EINVOICE_EFATURA_MOCK)';
  }
  return `Açık — ${ch.baseUrl}${ch.submitPath}`;
}
