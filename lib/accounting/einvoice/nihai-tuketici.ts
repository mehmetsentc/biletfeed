/**
 * GİB nihai tüketici (B2C / perakende) vergi kimliği.
 *
 * Bireysel bilet satışında TCKN/VKN toplanmaz. GİB e-Arşiv ve UBL-TR
 * alıcı kimliği boş bırakılamaz; sektörde yaygın kabul gören değer:
 * `11111111111` (11 hane, TCKN scheme).
 *
 * DB'de `Invoice.buyerTaxNumber` null kalır; yalnızca GİB/UBL katmanında
 * bu sabite map edilir. Admin UI "Nihai tüketici" gösterir.
 */

export const GIB_NIHAI_TUKETICI_TAX_ID = '11111111111' as const;

export type BuyerInvoiceKind = 'nihai_tuketici' | 'bireysel' | 'kurumsal';

export function normalizeTaxIdDigits(
  buyerTaxNumber?: string | null
): string {
  return (buyerTaxNumber ?? '').replace(/\D/g, '');
}

/** Boş veya GİB nihai tüketici placeholder */
export function isNihaiTuketiciTaxId(
  buyerTaxNumber?: string | null
): boolean {
  const digits = normalizeTaxIdDigits(buyerTaxNumber);
  return digits.length === 0 || digits === GIB_NIHAI_TUKETICI_TAX_ID;
}

/**
 * GİB / UBL gönderiminde kullanılacak alıcı vergi kimliği.
 * 10 hane VKN veya 11 hane TCKN olduğu gibi; aksi halde nihai tüketici.
 */
export function effectiveGibBuyerTaxId(
  buyerTaxNumber?: string | null
): string {
  const digits = normalizeTaxIdDigits(buyerTaxNumber);
  if (digits.length === 10 || digits.length === 11) return digits;
  return GIB_NIHAI_TUKETICI_TAX_ID;
}

export function resolveBuyerInvoiceKind(
  buyerTaxNumber?: string | null
): BuyerInvoiceKind {
  const digits = normalizeTaxIdDigits(buyerTaxNumber);
  if (digits.length === 10) return 'kurumsal';
  if (digits.length === 11 && digits !== GIB_NIHAI_TUKETICI_TAX_ID) {
    return 'bireysel';
  }
  return 'nihai_tuketici';
}

export function buyerInvoiceKindLabel(kind: BuyerInvoiceKind): string {
  switch (kind) {
    case 'kurumsal':
      return 'Kurumsal';
    case 'bireysel':
      return 'Bireysel (TCKN)';
    case 'nihai_tuketici':
      return 'Nihai tüketici';
  }
}
