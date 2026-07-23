import { describe, expect, it } from 'vitest';
import {
  classifyGibError,
  isDateOutsideRange,
  parseDateRangeFromMessage,
  parseGibDateToken
} from '@/lib/accounting/einvoice/gib-errors';
import {
  evaluateGibSendEligibility,
  isEFaturaBuyerBlocked
} from '@/lib/accounting/einvoice/gib-send-guard';
import { resolveInvoiceType } from '@/lib/accounting/invoice';

describe('classifyGibError', () => {
  it('detects GEÇİŞ date window and parses range', () => {
    const msg =
      'GEÇİŞ kullanıcısı yalnızca 08/07/2026 - 15/07/2026 tarihleri arasında fatura kesebilir';
    const c = classifyGibError(msg);
    expect(c?.category).toBe('gecis_tarih');
    expect(c?.dateRange?.fromLabel).toBe('08/07/2026');
    expect(c?.dateRange?.toLabel).toBe('15/07/2026');
    expect(c?.explanation).toContain('08/07/2026');
  });

  it('detects e-Fatura seller conflict', () => {
    const c = classifyGibError(
      'Bu VKN e-Fatura kullanıcısıdır, e-Arşiv portal kullanılamaz'
    );
    expect(c?.category).toBe('efatura_satici');
  });

  it('detects concurrent session', () => {
    const c = classifyGibError('GİB oturumu meşgul — başka bir gönderim bitene kadar bekleyin');
    expect(c?.category).toBe('concurrent_session');
  });

  it('detects ETTN/UUID issues', () => {
    const c = classifyGibError('Geçersiz ETTN / UUID formatı');
    expect(c?.category).toBe('ettn_uuid');
  });
});

describe('parseGibDateToken', () => {
  it('parses TR and ISO dates', () => {
    expect(parseGibDateToken('08/07/2026')?.toISOString()).toBe(
      '2026-07-08T00:00:00.000Z'
    );
    expect(parseGibDateToken('2026-07-15')?.toISOString()).toBe(
      '2026-07-15T00:00:00.000Z'
    );
  });
});

describe('parseDateRangeFromMessage', () => {
  it('returns undefined without two dates', () => {
    expect(parseDateRangeFromMessage('hata')).toBeUndefined();
  });
});

describe('isDateOutsideRange', () => {
  it('compares calendar days', () => {
    const range = parseDateRangeFromMessage('08/07/2026 - 15/07/2026')!;
    expect(isDateOutsideRange(new Date('2026-07-10T15:00:00.000Z'), range)).toBe(
      false
    );
    expect(isDateOutsideRange(new Date('2026-07-20T12:00:00.000Z'), range)).toBe(
      true
    );
  });
});

describe('resolveInvoiceType', () => {
  it('digit-normalizes tax ids', () => {
    expect(resolveInvoiceType('590-138-1024')).toBe('e_fatura');
    expect(resolveInvoiceType('12345678901')).toBe('e_arsiv');
    expect(resolveInvoiceType(null)).toBe('e_arsiv');
  });
});

describe('evaluateGibSendEligibility', () => {
  it('blocks e-Fatura buyers', () => {
    expect(
      isEFaturaBuyerBlocked({
        invoiceType: 'e_arsiv',
        buyerTaxNumber: '1234567890'
      })
    ).toBe(true);

    const e = evaluateGibSendEligibility({
      issuedAt: new Date('2026-07-10T12:00:00.000Z'),
      invoiceType: 'e_fatura',
      buyerTaxNumber: '1234567890'
    });
    expect(e.canSend).toBe(false);
    expect(e.blockReason).toContain('entegratör');
  });

  it('disables send when GEÇİŞ error and date outside parsed range', () => {
    const e = evaluateGibSendEligibility({
      issuedAt: new Date('2026-07-22T12:00:00.000Z'),
      invoiceType: 'e_arsiv',
      buyerTaxNumber: '11111111111',
      lastError:
        'GEÇİŞ kullanıcısı yalnızca 08/07/2026 - 15/07/2026 tarihleri arasında'
    });
    expect(e.canSend).toBe(false);
    expect(e.errorCategory).toBe('gecis_tarih');
    expect(e.blockReason).toContain('GEÇİŞ penceresi dışı');
  });

  it('allows send when date inside GEÇİŞ range after prior error', () => {
    const e = evaluateGibSendEligibility({
      issuedAt: new Date('2026-07-10T12:00:00.000Z'),
      invoiceType: 'e_arsiv',
      buyerTaxNumber: null,
      lastError:
        'GEÇİŞ kullanıcısı yalnızca 08/07/2026 - 15/07/2026 tarihleri arasında'
    });
    expect(e.canSend).toBe(true);
  });

  it('disables e-Arşiv on efatura_satici error', () => {
    const e = evaluateGibSendEligibility({
      issuedAt: new Date(),
      invoiceType: 'e_arsiv',
      lastError: 'Satıcı e-Fatura kullanıcısı — portal reddetti'
    });
    expect(e.canSend).toBe(false);
    expect(e.errorCategory).toBe('efatura_satici');
  });
});
