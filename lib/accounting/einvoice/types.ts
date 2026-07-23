/** GİB e-belge (e-Fatura / e-Arşiv) tipleri — entegratör-agnostik */

export type EInvoiceDocumentKind = 'e_fatura' | 'e_arsiv' | 'credit_note';

/** Hangi belge kanalı destekleniyor */
export type EInvoiceChannelSupport = 'e_arsiv' | 'e_fatura';

export type EInvoiceProviderStatus =
  | 'skipped'
  | 'pending'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'failed';

/**
 * Kanal outbox durumları (özellikle e-Fatura kendi entegratör katmanı).
 * Invoice.metadata.einvoice.dispatchStatus olarak saklanır.
 */
export type EInvoiceDispatchStatus =
  | 'pending_channel'
  | 'queued'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'error';

export type EInvoiceProviderName =
  | 'mock'
  | 'http'
  | 'gib'
  | 'gib-efatura'
  | 'none';

/** İnsan okunur kanal etiketi (admin UI) */
export type EInvoiceChannelId = 'gib-earsiv' | 'gib-efatura' | 'mock' | 'http' | 'none';

export interface EInvoiceSeller {
  tradeName: string;
  taxNumber: string;
  taxOffice: string;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  iban?: string;
  mersisNo?: string;
}

export interface EInvoiceBuyer {
  name: string;
  taxNumber?: string | null;
  taxOffice?: string | null;
  address?: string | null;
  email?: string | null;
  /** true → e-Fatura mükellefi varsayımı (VKN 10 hane) */
  isCorporate: boolean;
}

export interface EInvoiceLine {
  description: string;
  quantity: number;
  unitPriceNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
}

export interface EInvoicePayload {
  invoiceId: string;
  invoiceNumber: string;
  kind: EInvoiceDocumentKind;
  issuedAt: Date;
  currency: string;
  subtotalNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
  /** UBL-TR UUID / ETTN adayı */
  ettn: string;
  seller: EInvoiceSeller;
  buyer: EInvoiceBuyer;
  lines: EInvoiceLine[];
  /** İade ise orijinal fatura UUID/numara */
  originalEttn?: string | null;
  originalInvoiceNumber?: string | null;
  /** Hazır UBL-TR XML */
  ublXml: string;
}

export interface EInvoiceSubmitResult {
  ok: boolean;
  status: EInvoiceProviderStatus;
  /** GİB / entegratör UUID */
  uuid?: string;
  ettn?: string;
  pdfUrl?: string;
  pdfBase64?: string;
  providerRef?: string;
  raw?: unknown;
  error?: string;
  /** Outbox / kanal durumu */
  dispatchStatus?: EInvoiceDispatchStatus;
  envelopeUuid?: string;
  payloadHash?: string;
}

/** GİB mükellef / alıcı tip sorgusu sonucu (canlı API yoksa heuristic) */
export type TaxpayerEfaturaUser = 'yes' | 'no' | 'unknown';

export interface TaxpayerQueryResult {
  ok: boolean;
  taxId: string | null;
  taxIdKind: 'vkn' | 'tckn' | 'unknown' | 'missing';
  suggestedDocumentType: 'e_arsiv' | 'e_fatura';
  efaturaUser: TaxpayerEfaturaUser;
  source: 'heuristic' | 'gib' | 'cache';
  checkedAt: string;
  note?: string;
  error?: string;
}

export interface TaxpayerCheckCache {
  taxId: string | null;
  taxIdKind: TaxpayerQueryResult['taxIdKind'];
  suggestedDocumentType: 'e_arsiv' | 'e_fatura';
  efaturaUser: TaxpayerEfaturaUser;
  source: TaxpayerQueryResult['source'];
  checkedAt: string;
  note?: string;
}

/**
 * Paraşüt-benzeri kanal operasyonları.
 * createDraft / send / signSms* / getPdf / cancel / queryTaxpayer —
 * gateway bağlanınca UI aynı kalır.
 */
export interface EInvoiceProvider {
  readonly name: EInvoiceProviderName;
  /** Bu provider hangi belge türlerini taşıyabilir */
  readonly supports: readonly EInvoiceChannelSupport[];
  /** İnsan okunur kanal kimliği */
  readonly channelId: EInvoiceChannelId;
  submit(payload: EInvoicePayload): Promise<EInvoiceSubmitResult>;
  /** Alias — bazı kanallar taslak oluşturur (e-Arşiv) */
  submitDraft?(payload: EInvoicePayload): Promise<EInvoiceSubmitResult>;
  /** Paraşüt parity: createDraft ≡ submitDraft ?? submit */
  createDraft?(payload: EInvoicePayload): Promise<EInvoiceSubmitResult>;
  /** Paraşüt parity: send ≡ submit */
  send?(payload: EInvoicePayload): Promise<EInvoiceSubmitResult>;
  getStatus?(uuid: string): Promise<EInvoiceSubmitResult>;
  cancel?(
    uuid: string,
    opts?: { reason?: string; signed?: boolean }
  ): Promise<{ ok: boolean; error?: string; mock?: boolean }>;
  getPdf?(
    uuid: string,
    opts?: { signed?: boolean }
  ): Promise<{ ok: boolean; pdfUrl?: string; pdfBase64?: string; error?: string }>;
  downloadPdf?(
    uuid: string,
    opts?: { signed?: boolean }
  ): Promise<{ ok: boolean; pdfUrl?: string; pdfBase64?: string; error?: string }>;
  /** GİB SMS imza — OID döner */
  startSmsSign?(ettns: string[]): Promise<{
    ok: boolean;
    oid?: string;
    phoneMasked?: string;
    error?: string;
  }>;
  completeSmsSign?(params: {
    oid: string;
    code: string;
    ettns: string[];
  }): Promise<{ ok: boolean; error?: string }>;
  /** Alias: signSmsStart / signSmsComplete */
  signSmsStart?(ettns: string[]): Promise<{
    ok: boolean;
    oid?: string;
    phoneMasked?: string;
    error?: string;
  }>;
  signSmsComplete?(params: {
    oid: string;
    code: string;
    ettns: string[];
  }): Promise<{ ok: boolean; error?: string }>;
  /** Alıcı mükellef sorgusu (stub veya canlı) */
  queryTaxpayer?(taxId: string): Promise<TaxpayerQueryResult>;
}

export interface InvoiceEInvoiceMeta {
  provider: EInvoiceProviderName | string;
  status: EInvoiceProviderStatus;
  ettn?: string;
  uuid?: string;
  pdfUrl?: string;
  providerRef?: string;
  submittedAt?: string;
  signedAt?: string;
  lastError?: string;
  /** true → canlı GİB değil, mock/dev */
  mock?: boolean;
  /** GİB taslak; SMS/imza onayı bekliyor */
  needsSmsSign?: boolean;
  /** SMS operasyon id (kod girilene kadar) */
  smsOid?: string;
  smsPhoneMasked?: string;
  /** Kanal kimliği (gib-earsiv | gib-efatura | …) */
  channel?: EInvoiceChannelId | string;
  /** e-Fatura outbox durumu */
  dispatchStatus?: EInvoiceDispatchStatus;
  /** Zarf / envelope UUID (e-Fatura) */
  envelopeUuid?: string;
  /** Son gönderilen UBL/payload özeti */
  lastPayloadHash?: string;
  /** Kanal iptal zamanı (ISO) */
  cancelledAt?: string;
  cancelReason?: string;
  /** Mükellef / belge tipi kontrol önbelleği */
  taxpayerCheck?: TaxpayerCheckCache;
}
