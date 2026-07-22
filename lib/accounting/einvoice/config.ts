import type { EInvoiceProviderName } from '@/lib/accounting/einvoice/types';

export interface EInvoiceConfig {
  /** none = gönderim kapalı (yalnızca iç fatura kaydı) */
  provider: EInvoiceProviderName;
  enabled: boolean;
  apiBaseUrl: string;
  apiKey: string;
  username: string;
  password: string;
  /** true = earsivportaltest; false = canlı GİB portal */
  sandbox: boolean;
  /** Gönderim hataları sipariş akışını bozmasın */
  failSoft: boolean;
}

export function getEInvoiceConfig(): EInvoiceConfig {
  const raw = (process.env.EINVOICE_PROVIDER ?? 'mock').trim().toLowerCase();
  const provider: EInvoiceProviderName =
    raw === 'http' || raw === 'none' || raw === 'mock' || raw === 'gib'
      ? raw
      : 'mock';

  const enabledEnv = process.env.EINVOICE_ENABLED;
  const enabled =
    enabledEnv === 'true' ||
    (enabledEnv !== 'false' && provider !== 'none');

  return {
    provider: enabled ? provider : 'none',
    enabled: enabled && provider !== 'none',
    apiBaseUrl: (process.env.EINVOICE_API_BASE_URL ?? '').replace(/\/$/, ''),
    apiKey: process.env.EINVOICE_API_KEY?.trim() ?? '',
    username: process.env.EINVOICE_USERNAME?.trim() ?? '',
    password: process.env.EINVOICE_PASSWORD?.trim() ?? '',
    // gib varsayılanı: canlı portal (sandbox=false); diğerleri sandbox=true
    sandbox:
      process.env.EINVOICE_SANDBOX !== undefined
        ? process.env.EINVOICE_SANDBOX !== 'false'
        : provider !== 'gib',
    failSoft: process.env.EINVOICE_FAIL_SOFT !== 'false'
  };
}
