import { describe, expect, it } from 'vitest';
import {
  resolveLifecycleStatus,
  LIFECYCLE_LABELS
} from '@/lib/accounting/einvoice/lifecycle';
import { queryTaxpayerHeuristic } from '@/lib/accounting/einvoice/taxpayer';
import { createMockEInvoiceProvider } from '@/lib/accounting/einvoice/providers/mock';
import { createEttn } from '@/lib/accounting/einvoice/ubl';
import type { EInvoicePayload } from '@/lib/accounting/einvoice/types';

describe('resolveLifecycleStatus', () => {
  it('maps cancelled invoice', () => {
    expect(
      resolveLifecycleStatus({ invoiceStatus: 'cancelled' })
    ).toBe('iptal');
  });

  it('maps SMS pending', () => {
    expect(
      resolveLifecycleStatus({
        invoiceStatus: 'issued',
        einvoice: { status: 'submitted', needsSmsSign: true, provider: 'gib' }
      })
    ).toBe('sms_bekliyor');
  });

  it('maps accepted / rejected / draft', () => {
    expect(
      resolveLifecycleStatus({
        invoiceStatus: 'issued',
        einvoice: { status: 'accepted', provider: 'mock' }
      })
    ).toBe('kabul');
    expect(
      resolveLifecycleStatus({
        invoiceStatus: 'issued',
        einvoice: { status: 'failed', provider: 'mock' }
      })
    ).toBe('red');
    expect(
      resolveLifecycleStatus({ invoiceStatus: 'issued', einvoice: {} })
    ).toBe('taslak');
  });

  it('has Turkish labels for all statuses', () => {
    expect(LIFECYCLE_LABELS.sms_bekliyor).toBe('SMS bekliyor');
    expect(LIFECYCLE_LABELS.gonderildi).toBe('Gönderildi');
  });
});

describe('queryTaxpayerHeuristic', () => {
  it('VKN 10 → e_fatura', () => {
    const r = queryTaxpayerHeuristic('590-138-1024');
    expect(r.suggestedDocumentType).toBe('e_fatura');
    expect(r.taxIdKind).toBe('vkn');
    expect(r.taxId).toBe('5901381024');
  });

  it('TCKN 11 → e_arsiv', () => {
    const r = queryTaxpayerHeuristic('12345678901');
    expect(r.suggestedDocumentType).toBe('e_arsiv');
    expect(r.taxIdKind).toBe('tckn');
    expect(r.efaturaUser).toBe('no');
  });
});

describe('mock provider Paraşüt ops', () => {
  const payload = (): EInvoicePayload => {
    const ettn = createEttn();
    return {
      invoiceId: 'x',
      invoiceNumber: 'BF2026000001',
      kind: 'e_arsiv',
      issuedAt: new Date(),
      currency: 'TRY',
      subtotalNet: 100,
      vatRate: 20,
      vatAmount: 20,
      totalGross: 120,
      ettn,
      seller: {
        tradeName: 'T',
        taxNumber: '1',
        taxOffice: 'A',
        address: 'B',
        city: 'İstanbul',
        country: 'TR',
        email: 'a@b.c',
        phone: '5'
      },
      buyer: { name: 'Alıcı', isCorporate: false },
      lines: [
        {
          description: 'Bilet',
          quantity: 1,
          unitPriceNet: 100,
          vatRate: 20,
          vatAmount: 20,
          totalGross: 120
        }
      ],
      ublXml: '<Invoice/>'
    };
  };

  it('supports createDraft, send, cancel, queryTaxpayer', async () => {
    const p = createMockEInvoiceProvider();
    expect(p.createDraft).toBeDefined();
    expect(p.send).toBeDefined();
    expect(p.cancel).toBeDefined();
    expect(p.queryTaxpayer).toBeDefined();

    const draft = await p.createDraft!(payload());
    expect(draft.ok).toBe(true);

    const sent = await p.send!(payload());
    expect(sent.ok).toBe(true);

    const cancel = await p.cancel!(sent.uuid!);
    expect(cancel.ok).toBe(true);
    expect(cancel.mock).toBe(true);

    const tp = await p.queryTaxpayer!('1234567890');
    expect(tp.suggestedDocumentType).toBe('e_fatura');
  });
});
