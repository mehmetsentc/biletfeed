import { describe, expect, it } from 'vitest';
import { createGibEfaturaProvider } from '@/lib/accounting/einvoice/providers/gib-efatura';
import type { EInvoiceConfig } from '@/lib/accounting/einvoice/config';
import type { EInvoicePayload } from '@/lib/accounting/einvoice/types';
import { createEttn } from '@/lib/accounting/einvoice/ubl';

function baseConfig(overrides?: Partial<EInvoiceConfig['efatura']>): EInvoiceConfig {
  return {
    provider: 'gib',
    enabled: true,
    apiBaseUrl: '',
    apiKey: '',
    username: 'u',
    password: 'p',
    sandbox: true,
    failSoft: true,
    gecisDateFrom: '',
    gecisDateTo: '',
    efatura: {
      enabled: true,
      mock: true,
      baseUrl: '',
      submitPath: '/efatura/submit',
      statusPath: '/efatura/status/{uuid}',
      cancelPath: '/efatura/cancel/{uuid}',
      pdfPath: '/efatura/pdf/{uuid}',
      apiKey: '',
      username: '',
      password: '',
      ...overrides
    }
  };
}

function samplePayload(kind: 'e_fatura' | 'e_arsiv' = 'e_fatura'): EInvoicePayload {
  const ettn = createEttn();
  return {
    invoiceId: 'inv1',
    invoiceNumber: 'BF2026000099',
    kind,
    issuedAt: new Date('2026-07-10T12:00:00.000Z'),
    currency: 'TRY',
    subtotalNet: 100,
    vatRate: 20,
    vatAmount: 20,
    totalGross: 120,
    ettn,
    seller: {
      tradeName: 'Test',
      taxNumber: '5901381024',
      taxOffice: 'Test',
      address: 'Adres',
      city: 'İstanbul',
      country: 'Türkiye',
      email: 'a@b.com',
      phone: '555'
    },
    buyer: {
      name: 'Firma AŞ',
      taxNumber: '1234567890',
      isCorporate: true
    },
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
}

describe('createGibEfaturaProvider', () => {
  it('supports only e_fatura channel', () => {
    const p = createGibEfaturaProvider(baseConfig());
    expect(p.name).toBe('gib-efatura');
    expect(p.supports).toEqual(['e_fatura']);
    expect(p.channelId).toBe('gib-efatura');
  });

  it('mock submit returns sent dispatch with envelope', async () => {
    const p = createGibEfaturaProvider(baseConfig({ mock: true }));
    const result = await p.submit(samplePayload('e_fatura'));
    expect(result.ok).toBe(true);
    expect(result.dispatchStatus).toBe('sent');
    expect(result.envelopeUuid).toBeTruthy();
    expect(result.payloadHash).toBeTruthy();
  });

  it('rejects e_arsiv payloads', async () => {
    const p = createGibEfaturaProvider(baseConfig());
    const result = await p.submit(samplePayload('e_arsiv'));
    expect(result.ok).toBe(false);
    expect(result.error).toContain('e_fatura');
  });

  it('returns pending_channel when disabled and not mock', async () => {
    const p = createGibEfaturaProvider(
      baseConfig({ enabled: false, mock: false })
    );
    const result = await p.submit(samplePayload('e_fatura'));
    expect(result.ok).toBe(false);
    expect(result.dispatchStatus).toBe('pending_channel');
    expect(result.error).toContain('yapılandırılmadı');
  });

  it('mock cancel succeeds for UI parity', async () => {
    const p = createGibEfaturaProvider(baseConfig({ mock: true }));
    const cancel = await p.cancel!('00000000-0000-0000-0000-000000000001');
    expect(cancel.ok).toBe(true);
    expect(cancel.mock).toBe(true);
  });
});
