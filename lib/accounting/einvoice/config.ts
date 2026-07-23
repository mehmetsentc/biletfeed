import type {
  EInvoiceChannelId,
  EInvoiceProviderName
} from '@/lib/accounting/einvoice/types';

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
  /**
   * Ops: mevcut GİB GEÇİŞ fatura tarihi penceresi (dd/MM/yyyy veya ISO).
   * Deploy olmadan panel disable mantığında kullanılır.
   */
  gecisDateFrom: string;
  gecisDateTo: string;
  /** BiletFeed kendi e-Fatura kanalı */
  efatura: EFaturaChannelConfig;
}

/**
 * BiletFeed in-house e-Fatura integrator katmanı.
 * GİB özel entegratör lisansı ayrı bir yasal süreçtir; bu config yazılım kanalını açar.
 */
export interface EFaturaChannelConfig {
  /** EINVOICE_EFATURA_ENABLED=true ile açılır */
  enabled: boolean;
  /** Zorunlu mock — endpoint yoksa veya EINVOICE_EFATURA_MOCK=true */
  mock: boolean;
  baseUrl: string;
  submitPath: string;
  statusPath: string;
  cancelPath: string;
  pdfPath: string;
  apiKey: string;
  username: string;
  password: string;
}

export function getEFaturaChannelConfig(): EFaturaChannelConfig {
  const enabled = process.env.EINVOICE_EFATURA_ENABLED === 'true';
  const baseUrl = (process.env.EINVOICE_EFATURA_BASE_URL ?? '').replace(
    /\/$/,
    ''
  );
  const forceMock = process.env.EINVOICE_EFATURA_MOCK === 'true';
  const mock =
    forceMock || (enabled && !baseUrl) || process.env.EINVOICE_PROVIDER === 'mock';

  return {
    enabled,
    mock,
    baseUrl,
    submitPath: process.env.EINVOICE_EFATURA_SUBMIT_PATH ?? '/efatura/submit',
    statusPath:
      process.env.EINVOICE_EFATURA_STATUS_PATH ?? '/efatura/status/{uuid}',
    cancelPath:
      process.env.EINVOICE_EFATURA_CANCEL_PATH ?? '/efatura/cancel/{uuid}',
    pdfPath: process.env.EINVOICE_EFATURA_PDF_PATH ?? '/efatura/pdf/{uuid}',
    apiKey: process.env.EINVOICE_EFATURA_API_KEY?.trim() ?? '',
    username: process.env.EINVOICE_EFATURA_USERNAME?.trim() ?? '',
    password: process.env.EINVOICE_EFATURA_PASSWORD?.trim() ?? ''
  };
}

export function getEInvoiceConfig(): EInvoiceConfig {
  const raw = (process.env.EINVOICE_PROVIDER ?? 'mock').trim().toLowerCase();
  const provider: EInvoiceProviderName =
    raw === 'http' ||
    raw === 'none' ||
    raw === 'mock' ||
    raw === 'gib' ||
    raw === 'gib-efatura'
      ? (raw as EInvoiceProviderName)
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
    failSoft: process.env.EINVOICE_FAIL_SOFT !== 'false',
    gecisDateFrom: process.env.EINVOICE_GECIS_DATE_FROM?.trim() ?? '',
    gecisDateTo: process.env.EINVOICE_GECIS_DATE_TO?.trim() ?? '',
    efatura: getEFaturaChannelConfig()
  };
}

/** e-Fatura kanalı gönderime hazır mı? (mock dahil) */
export function isEFaturaChannelReady(
  config: EInvoiceConfig = getEInvoiceConfig()
): boolean {
  if (config.provider === 'mock') return true;
  if (config.provider === 'http' && config.apiBaseUrl) return true;
  return config.efatura.enabled || config.efatura.mock;
}

export function describeEFaturaChannel(
  config: EInvoiceConfig = getEInvoiceConfig()
): {
  ready: boolean;
  channelId: EInvoiceChannelId;
  label: string;
  setupHint: string | null;
} {
  if (config.provider === 'mock') {
    return {
      ready: true,
      channelId: 'mock',
      label: 'Mock e-Fatura kanalı',
      setupHint: null
    };
  }
  if (config.provider === 'http' && config.apiBaseUrl) {
    return {
      ready: true,
      channelId: 'http',
      label: 'HTTP entegratör köprüsü (e-Fatura)',
      setupHint: null
    };
  }
  if (!config.efatura.enabled) {
    return {
      ready: false,
      channelId: 'none',
      label: 'BiletFeed e-Fatura kanalı (kapalı)',
      setupHint:
        'e-Fatura gönderimi için entegratör/kanal yapılandırılmadı. EINVOICE_EFATURA_ENABLED=true ve isteğe bağlı EINVOICE_EFATURA_BASE_URL / kimlik bilgilerini ayarlayın (geliştirme: EINVOICE_EFATURA_MOCK=true).'
    };
  }
  if (config.efatura.mock || !config.efatura.baseUrl) {
    return {
      ready: true,
      channelId: 'gib-efatura',
      label: 'BiletFeed e-Fatura kanalı (mock)',
      setupHint: null
    };
  }
  return {
    ready: true,
    channelId: 'gib-efatura',
    label: 'BiletFeed e-Fatura kanalı',
    setupHint: null
  };
}

export const EFATURA_CHANNEL_NOT_CONFIGURED_MESSAGE =
  'e-Fatura gönderimi için entegratör/kanal yapılandırılmadı';
