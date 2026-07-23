export { getEInvoiceConfig } from '@/lib/accounting/einvoice/config';
export { getEInvoiceProvider } from '@/lib/accounting/einvoice/provider';
export { submitInvoiceToGib } from '@/lib/accounting/einvoice/submit';
export { readEInvoiceMeta } from '@/lib/accounting/einvoice/meta';
export {
  classifyGibError,
  parseDateRangeFromMessage,
  parseGibDateToken
} from '@/lib/accounting/einvoice/gib-errors';
export {
  evaluateGibSendEligibility,
  isEFaturaBuyerBlocked,
  EFATURA_BUYER_BLOCK_MESSAGE
} from '@/lib/accounting/einvoice/gib-send-guard';
export {
  startInvoiceSmsSign,
  confirmInvoiceSmsSign
} from '@/lib/accounting/einvoice/sms';
export {
  buildEInvoicePayload,
  buildUblTrXml,
  createEttn
} from '@/lib/accounting/einvoice/ubl';
export { verifyGibEarsivLogin } from '@/lib/accounting/einvoice/providers/gib-earsiv';
export type {
  EInvoicePayload,
  EInvoiceProvider,
  EInvoiceSubmitResult,
  InvoiceEInvoiceMeta
} from '@/lib/accounting/einvoice/types';
export type {
  GibErrorCategory,
  ClassifiedGibError
} from '@/lib/accounting/einvoice/gib-errors';
