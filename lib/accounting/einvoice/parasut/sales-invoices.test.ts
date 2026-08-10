import { describe, expect, it } from 'vitest';
import { buildSalesInvoiceBody } from '@/lib/accounting/einvoice/parasut/sales-invoices';
import type { EInvoicePayload } from '@/lib/accounting/einvoice/types';

function samplePayload(
  overrides?: Partial<EInvoicePayload>
): EInvoicePayload {
  return {
    invoiceId: 'inv_1',
    invoiceNumber: 'BF2026000001',
    kind: 'e_arsiv',
    issuedAt: new Date('2026-08-10T12:00:00.000Z'),
    currency: 'TRY',
    subtotalNet: 100,
    vatRate: 20,
    vatAmount: 20,
    totalGross: 120,
    ettn: '11111111-1111-1111-1111-111111111111',
    seller: {
      tradeName: 'KSD',
      taxNumber: '5901381024',
      taxOffice: 'Test',
      address: 'Adres',
      city: 'İstanbul',
      country: 'TR',
      email: 'fatura@biletfeed.com',
      phone: ''
    },
    buyer: {
      name: 'Ali Veli',
      taxNumber: null,
      email: 'ali@example.com',
      isCorporate: false
    },
    lines: [
      {
        description: 'Konser — Genel',
        quantity: 2,
        unitPriceNet: 50,
        vatRate: 20,
        vatAmount: 20,
        totalGross: 120
      }
    ],
    ublXml: '<Invoice/>',
    ...overrides
  };
}

describe('buildSalesInvoiceBody', () => {
  it('maps TRY to TRL and includes contact + product details', () => {
    const body = buildSalesInvoiceBody({
      payload: samplePayload(),
      contactId: '42',
      productId: '99'
    }) as {
      data: {
        type: string;
        attributes: Record<string, unknown>;
        relationships: {
          contact: { data: { id: string; type: string } };
          details: {
            data: Array<{
              attributes: {
                quantity: number;
                unit_price: number;
                vat_rate: number;
              };
              relationships: { product: { data: { id: string } } };
            }>;
          };
        };
      };
    };

    expect(body.data.type).toBe('sales_invoices');
    expect(body.data.attributes.currency).toBe('TRL');
    expect(body.data.attributes.item_type).toBe('invoice');
    expect(body.data.attributes.order_no).toBe('BF2026000001');
    expect(body.data.attributes.cash_sale).toBe(false);
    expect(body.data.attributes.payment_account_id).toBeUndefined();
    expect(body.data.relationships.contact.data).toEqual({
      id: '42',
      type: 'contacts'
    });
    expect(body.data.relationships.details.data).toHaveLength(1);
    expect(body.data.relationships.details.data[0]!.attributes.quantity).toBe(2);
    expect(body.data.relationships.details.data[0]!.attributes.unit_price).toBe(
      50
    );
    expect(body.data.relationships.details.data[0]!.attributes.vat_rate).toBe(
      20
    );
    expect(
      body.data.relationships.details.data[0]!.relationships.product.data.id
    ).toBe('99');
  });

  it('sets cash sale payment fields when account id present', () => {
    const body = buildSalesInvoiceBody({
      payload: samplePayload(),
      contactId: '42',
      productId: '99',
      paymentAccountId: '1000651923'
    }) as {
      data: {
        attributes: {
          cash_sale: boolean;
          payment_account_id: number;
          payment_date: string;
        };
      };
    };

    expect(body.data.attributes.cash_sale).toBe(true);
    expect(body.data.attributes.payment_account_id).toBe(1000651923);
    expect(body.data.attributes.payment_date).toBe('2026-08-10');
  });

  it('uses refund item_type for credit notes', () => {
    const body = buildSalesInvoiceBody({
      payload: samplePayload({ kind: 'credit_note' }),
      contactId: '1',
      productId: '2',
      itemType: 'refund'
    }) as { data: { attributes: { item_type: string } } };

    expect(body.data.attributes.item_type).toBe('refund');
  });
});
