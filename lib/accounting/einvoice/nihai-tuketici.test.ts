import { describe, expect, it } from 'vitest';
import {
  GIB_NIHAI_TUKETICI_TAX_ID,
  effectiveGibBuyerTaxId,
  isNihaiTuketiciTaxId,
  resolveBuyerInvoiceKind
} from '@/lib/accounting/einvoice/nihai-tuketici';
import { resolveInvoiceType } from '@/lib/accounting/invoice';

describe('nihai tüketici / B2C tax id', () => {
  it('maps empty tax id to GİB placeholder', () => {
    expect(effectiveGibBuyerTaxId(null)).toBe(GIB_NIHAI_TUKETICI_TAX_ID);
    expect(effectiveGibBuyerTaxId('')).toBe(GIB_NIHAI_TUKETICI_TAX_ID);
    expect(effectiveGibBuyerTaxId('  ')).toBe(GIB_NIHAI_TUKETICI_TAX_ID);
    expect(isNihaiTuketiciTaxId(null)).toBe(true);
    expect(isNihaiTuketiciTaxId(GIB_NIHAI_TUKETICI_TAX_ID)).toBe(true);
  });

  it('keeps valid VKN / TCKN', () => {
    expect(effectiveGibBuyerTaxId('1234567890')).toBe('1234567890');
    expect(effectiveGibBuyerTaxId('12345678901')).toBe('12345678901');
    expect(isNihaiTuketiciTaxId('12345678901')).toBe(false);
  });

  it('classifies buyer kind', () => {
    expect(resolveBuyerInvoiceKind(null)).toBe('nihai_tuketici');
    expect(resolveBuyerInvoiceKind(GIB_NIHAI_TUKETICI_TAX_ID)).toBe(
      'nihai_tuketici'
    );
    expect(resolveBuyerInvoiceKind('12345678901')).toBe('bireysel');
    expect(resolveBuyerInvoiceKind('1234567890')).toBe('kurumsal');
  });

  it('defaults invoice type to e_arsiv for nihai tüketici', () => {
    expect(resolveInvoiceType(null)).toBe('e_arsiv');
    expect(resolveInvoiceType('')).toBe('e_arsiv');
    expect(resolveInvoiceType(GIB_NIHAI_TUKETICI_TAX_ID)).toBe('e_arsiv');
    expect(resolveInvoiceType('12345678901')).toBe('e_arsiv');
    expect(resolveInvoiceType('1234567890')).toBe('e_fatura');
  });
});
