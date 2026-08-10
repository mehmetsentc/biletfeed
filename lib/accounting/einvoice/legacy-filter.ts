import { readEInvoiceMeta } from '@/lib/accounting/einvoice/meta';
import type { InvoiceEInvoiceMeta } from '@/lib/accounting/einvoice/types';

const LEGACY_ERROR_RE =
  /GİB|GIB\b|GEÇİŞ|e-Arşiv portal|EINVOICE_PROVIDER=parasut ve PARASUT|yapılandırılmamış|SMS ile imzala/i;

/**
 * Eski GİB / başarısız deneme — Paraşüt sıfırdan listede görünmez.
 * Temiz taslak veya Paraşüt’te başarılı/kuyrukta kayıtlar kalır.
 */
export function isLegacyGibInvoiceAttempt(
  einv: Partial<InvoiceEInvoiceMeta> | null | undefined,
  invoiceStatus: string
): boolean {
  if (invoiceStatus === 'cancelled') return true;

  const meta = einv ?? {};
  const channel = String(meta.channel ?? '');
  const provider = String(meta.provider ?? '');

  if (channel === 'gib-earsiv' || channel === 'gib-efatura') return true;
  if (provider === 'gib' || provider === 'gib-efatura') return true;
  if (meta.mock === true && channel !== 'parasut') return true;

  if (meta.status === 'failed' || meta.status === 'rejected') return true;
  if (
    meta.dispatchStatus === 'rejected' ||
    meta.dispatchStatus === 'error'
  ) {
    return true;
  }

  if (
    typeof meta.lastError === 'string' &&
    meta.lastError.trim() &&
    LEGACY_ERROR_RE.test(meta.lastError)
  ) {
    return true;
  }

  return false;
}

export function shouldShowOnParasutInvoiceBoard(
  metadata: unknown,
  invoiceStatus: string
): boolean {
  const einv = readEInvoiceMeta(metadata);
  return !isLegacyGibInvoiceAttempt(einv, invoiceStatus);
}
