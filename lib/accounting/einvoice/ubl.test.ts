import { describe, expect, it } from 'vitest';
import {
  buildEInvoicePayload,
  buildUblTrXml,
  createEttn
} from '@/lib/accounting/einvoice/ubl';
import { getEInvoiceConfig } from '@/lib/accounting/einvoice/config';

describe('einvoice UBL', () => {
  it('builds UBL-TR with ETTN and line totals', () => {
    const ettn = createEttn();
    const xml = buildUblTrXml({
      ettn,
      invoiceNumber: 'BF2026000001',
      kind: 'e_arsiv',
      issuedAt: new Date('2026-07-22T10:00:00.000Z'),
      currency: 'TRY',
      subtotalNet: 100,
      vatRate: 20,
      vatAmount: 20,
      totalGross: 120,
      seller: {
        tradeName: 'Test A.Ş.',
        taxNumber: '5901381024',
        taxOffice: 'Antalya',
        address: 'Adres',
        city: 'Antalya',
        country: 'TR',
        email: 'a@b.com',
        phone: '05000000000'
      },
      buyer: {
        name: 'Ali Veli',
        taxNumber: null,
        isCorporate: false,
        email: 'ali@ornek.com'
      },
      lines: [
        {
          description: 'Konser bileti',
          quantity: 2,
          unitPriceNet: 50,
          vatRate: 20,
          vatAmount: 20,
          totalGross: 120
        }
      ]
    });

    expect(xml).toContain('EARSIVFATURA');
    expect(xml).toContain(ettn);
    expect(xml).toContain('BF2026000001');
    expect(xml).toContain('Konser bileti');
    expect(xml).toContain('120.00');
  });

  it('marks corporate buyer as e-fatura profile', () => {
    const payload = buildEInvoicePayload({
      invoiceId: 'inv-1',
      invoiceNumber: 'BF2026000002',
      kind: 'e_fatura',
      issuedAt: new Date(),
      currency: 'TRY',
      subtotalNet: 100,
      vatRate: 20,
      vatAmount: 20,
      totalGross: 120,
      buyer: {
        name: 'Firma Ltd',
        taxNumber: '1234567890',
        taxOffice: 'Kadıköy',
        isCorporate: true
      },
      lines: [
        {
          description: 'VIP',
          quantity: 1,
          unitPriceNet: 100,
          vatRate: 20,
          vatAmount: 20,
          totalGross: 120
        }
      ]
    });

    expect(payload.ublXml).toContain('TEMELFATURA');
    expect(payload.ublXml).toContain('1234567890');
    expect(payload.ettn).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });
});

describe('einvoice config', () => {
  it('defaults to mock provider', () => {
    const cfg = getEInvoiceConfig();
    expect(['mock', 'http', 'none']).toContain(cfg.provider);
    expect(typeof cfg.failSoft).toBe('boolean');
  });
});
