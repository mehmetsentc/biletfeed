import { describe, expect, it } from 'vitest';
import {
  isLegacyGibInvoiceAttempt,
  shouldShowOnParasutInvoiceBoard
} from '@/lib/accounting/einvoice/legacy-filter';

describe('isLegacyGibInvoiceAttempt', () => {
  it('hides cancelled invoices', () => {
    expect(isLegacyGibInvoiceAttempt({}, 'cancelled')).toBe(true);
  });

  it('hides GİB channel / provider', () => {
    expect(
      isLegacyGibInvoiceAttempt({ channel: 'gib-earsiv' }, 'issued')
    ).toBe(true);
    expect(
      isLegacyGibInvoiceAttempt({ provider: 'gib' }, 'issued')
    ).toBe(true);
  });

  it('hides failed / rejected and GİB error text', () => {
    expect(
      isLegacyGibInvoiceAttempt({ status: 'failed' }, 'issued')
    ).toBe(true);
    expect(
      isLegacyGibInvoiceAttempt(
        { lastError: 'EINVOICE_PROVIDER=parasut ve PARASUT_CLIENT_ID gerekli.' },
        'issued'
      )
    ).toBe(true);
  });

  it('keeps clean draft and parasut success', () => {
    expect(isLegacyGibInvoiceAttempt({}, 'issued')).toBe(false);
    expect(
      isLegacyGibInvoiceAttempt(
        { channel: 'parasut', provider: 'parasut', status: 'submitted' },
        'issued'
      )
    ).toBe(false);
  });

  it('board helper reads metadata.einvoice', () => {
    expect(
      shouldShowOnParasutInvoiceBoard(
        { einvoice: { channel: 'gib-earsiv' } },
        'issued'
      )
    ).toBe(false);
    expect(shouldShowOnParasutInvoiceBoard({ einvoice: {} }, 'issued')).toBe(
      true
    );
  });
});
