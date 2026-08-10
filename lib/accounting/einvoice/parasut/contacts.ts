import type { ParasutConfig } from '@/lib/accounting/einvoice/parasut/config';
import {
  asResourceList,
  asSingleResource,
  parasutRequest,
  type JsonApiResource
} from '@/lib/accounting/einvoice/parasut/client';
import type { EInvoiceBuyer } from '@/lib/accounting/einvoice/types';

function digits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

export async function findContactByTaxOrEmail(
  config: ParasutConfig,
  buyer: EInvoiceBuyer
): Promise<JsonApiResource | null> {
  const tax = digits(buyer.taxNumber);
  if (tax.length >= 10) {
    const byTax = await parasutRequest(config, '/contacts', {
      query: {
        'filter[tax_number]': tax,
        'page[number]': 1,
        'page[size]': 15
      }
    });
    const hit = asResourceList(byTax)[0];
    if (hit) return hit;
  }
  if (buyer.email?.trim()) {
    const byEmail = await parasutRequest(config, '/contacts', {
      query: {
        'filter[email]': buyer.email.trim(),
        'page[number]': 1,
        'page[size]': 15
      }
    });
    const hit = asResourceList(byEmail)[0];
    if (hit) return hit;
  }
  return null;
}

export async function createContact(
  config: ParasutConfig,
  buyer: EInvoiceBuyer
): Promise<JsonApiResource> {
  const tax = digits(buyer.taxNumber);
  const isCompany = buyer.isCorporate || tax.length === 10;
  // Paraşüt e-belge: kişi için 11 hane TCKN zorunlu; boşsa nihai tüketici
  const taxNumber =
    tax.length >= 10 ? tax : isCompany ? undefined : '11111111111';
  const doc = await parasutRequest(config, '/contacts', {
    method: 'POST',
    body: {
      data: {
        type: 'contacts',
        attributes: {
          name: buyer.name || (isCompany ? 'Kurumsal Müşteri' : 'Bireysel Müşteri'),
          email: buyer.email?.trim() || undefined,
          contact_type: isCompany ? 'company' : 'person',
          tax_number: taxNumber,
          tax_office: buyer.taxOffice?.trim() || undefined,
          address: buyer.address?.trim() || 'Türkiye',
          district: 'Merkez',
          city: 'İstanbul',
          country: 'Türkiye',
          account_type: 'customer'
        }
      }
    }
  });
  const created = asSingleResource(doc);
  if (!created?.id) throw new Error('Paraşüt müşteri oluşturulamadı');
  return created;
}

export async function ensureContact(
  config: ParasutConfig,
  buyer: EInvoiceBuyer
): Promise<string> {
  const existing = await findContactByTaxOrEmail(config, buyer);
  if (existing?.id) {
    const attrs = existing.attributes ?? {};
    const needsAddress =
      !attrs.city ||
      !attrs.district ||
      !attrs.address ||
      !digits(String(attrs.tax_number ?? ''));
    if (needsAddress) {
      const tax = digits(buyer.taxNumber);
      const isCompany = buyer.isCorporate || tax.length === 10;
      await parasutRequest(config, `/contacts/${existing.id}`, {
        method: 'PUT',
        body: {
          data: {
            id: existing.id,
            type: 'contacts',
            attributes: {
              address: buyer.address?.trim() || 'Türkiye',
              district: 'Merkez',
              city: 'İstanbul',
              country: 'Türkiye',
              tax_number:
                tax.length >= 10 ? tax : isCompany ? undefined : '11111111111'
            }
          }
        }
      });
    }
    return existing.id;
  }
  const created = await createContact(config, buyer);
  return created.id;
}
