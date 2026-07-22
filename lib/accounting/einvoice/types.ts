/** GİB e-belge (e-Fatura / e-Arşiv) tipleri — entegratör-agnostik */

export type EInvoiceDocumentKind = 'e_fatura' | 'e_arsiv' | 'credit_note';

export type EInvoiceProviderStatus =
  | 'skipped'
  | 'pending'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'failed';

export type EInvoiceProviderName = 'mock' | 'http' | 'gib' | 'none';


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
}

export interface EInvoiceProvider {
  readonly name: EInvoiceProviderName;
  submit(payload: EInvoicePayload): Promise<EInvoiceSubmitResult>;
  getStatus?(uuid: string): Promise<EInvoiceSubmitResult>;
  getPdf?(
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
}
