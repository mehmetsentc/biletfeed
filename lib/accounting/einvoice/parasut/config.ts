/**
 * Paraşüt API V4 — env + yapılandırma.
 * Credential’lar yalnızca env’de; asla commit etme.
 */

export interface ParasutConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  companyId: string;
  /** Peşin satış (cash_sale) — İyzico hakedişinin düştüğü Paraşüt kasa/banka */
  paymentAccountId: string;
  /** Opsiyonel sabit ürün; yoksa kod ile bul/oluştur */
  defaultProductId: string;
  productCode: string;
  redirectUri: string;
  oauthBaseUrl: string;
  apiBaseUrl: string;
  /** Paraşüt resmi e-belge maili varken Resend fatura mailini atla */
  skipResendInvoice: boolean;
  /** Job poll süresi (ms) */
  jobPollMs: number;
  jobTimeoutMs: number;
}

export function getParasutConfig(): ParasutConfig {
  const companyId = (process.env.PARASUT_COMPANY_ID ?? '').trim();
  const clientId = (process.env.PARASUT_CLIENT_ID ?? '').trim();
  const clientSecret = (process.env.PARASUT_CLIENT_SECRET ?? '').trim();
  const username = (process.env.PARASUT_USERNAME ?? '').trim();
  const password = (process.env.PARASUT_PASSWORD ?? '').trim();

  const oauthBase = (
    process.env.PARASUT_OAUTH_BASE_URL ?? 'https://api.parasut.com'
  ).replace(/\/$/, '');
  const apiBase = (
    process.env.PARASUT_API_BASE_URL ?? `${oauthBase}/v4`
  ).replace(/\/$/, '');

  const enabled =
    process.env.EINVOICE_PROVIDER?.trim().toLowerCase() === 'parasut' &&
    Boolean(clientId && clientSecret && username && password && companyId);

  return {
    enabled,
    clientId,
    clientSecret,
    username,
    password,
    companyId,
    paymentAccountId: (process.env.PARASUT_PAYMENT_ACCOUNT_ID ?? '').trim(),
    defaultProductId: (process.env.PARASUT_DEFAULT_PRODUCT_ID ?? '').trim(),
    productCode: (process.env.PARASUT_PRODUCT_CODE ?? 'BILETFEED_TICKET').trim(),
    redirectUri:
      process.env.PARASUT_REDIRECT_URI?.trim() ||
      'urn:ietf:wg:oauth:2.0:oob',
    oauthBaseUrl: oauthBase,
    apiBaseUrl: apiBase,
    skipResendInvoice: process.env.PARASUT_SKIP_RESEND_INVOICE !== 'false',
    jobPollMs: Number(process.env.PARASUT_JOB_POLL_MS ?? 1500) || 1500,
    jobTimeoutMs: Number(process.env.PARASUT_JOB_TIMEOUT_MS ?? 45000) || 45000
  };
}

export function isParasutConfigured(
  config: ParasutConfig = getParasutConfig()
): boolean {
  return (
    Boolean(config.clientId) &&
    Boolean(config.clientSecret) &&
    Boolean(config.username) &&
    Boolean(config.password) &&
    Boolean(config.companyId)
  );
}

export function describeParasutChannel(
  config: ParasutConfig = getParasutConfig()
): {
  ready: boolean;
  channelId: 'parasut' | 'none';
  label: string;
  setupHint: string | null;
  companyId: string | null;
} {
  if (!isParasutConfigured(config)) {
    return {
      ready: false,
      channelId: 'none',
      label: 'Paraşüt (yapılandırılmamış)',
      setupHint:
        'EINVOICE_PROVIDER=parasut ve PARASUT_CLIENT_ID / SECRET / USERNAME / PASSWORD / COMPANY_ID gerekli.',
      companyId: null
    };
  }
  return {
    ready: true,
    channelId: 'parasut',
    label: `Paraşüt (şirket #${config.companyId})`,
    setupHint: null,
    companyId: config.companyId
  };
}
