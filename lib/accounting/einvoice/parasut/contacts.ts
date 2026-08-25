import type { ParasutConfig } from '@/lib/accounting/einvoice/parasut/config';
import {
  asResourceList,
  asSingleResource,
  parasutRequest,
  type JsonApiResource
} from '@/lib/accounting/einvoice/parasut/client';
import {
  GIB_NIHAI_TUKETICI_TAX_ID,
  isNihaiTuketiciTaxId
} from '@/lib/accounting/einvoice/nihai-tuketici';
import type { EInvoiceBuyer } from '@/lib/accounting/einvoice/types';

function digits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/**
 * Nihai tüketici (11111111111) vergi no ile arama YAPILMAZ —
 * aksi halde tüm B2C faturalar ilk oluşturulan kontağa (yanlış isme) bağlanır.
 */
export async function findContactByTaxOrEmail(
  config: ParasutConfig,
  buyer: EInvoiceBuyer
): Promise<JsonApiResource | null> {
  const tax = digits(buyer.taxNumber);
  const nihai = isNihaiTuketiciTaxId(tax);

  // Gerçek VKN/TCKN ile ara (nihai placeholder hariç)
  if (!nihai && tax.length >= 10) {
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
  const nihai = isNihaiTuketiciTaxId(tax);
  // Paraşüt e-belge: kişi için 11 hane TCKN zorunlu; boş/nihai → placeholder
  const taxNumber = isCompany
    ? tax.length === 10
      ? tax
      : undefined
    : nihai || tax.length !== 11
      ? GIB_NIHAI_TUKETICI_TAX_ID
      : tax;

  const doc = await parasutRequest(config, '/contacts', {
    method: 'POST',
    body: {
      data: {
        type: 'contacts',
        attributes: {
          name:
            buyer.name?.trim() ||
            (isCompany ? 'Kurumsal Müşteri' : 'Bireysel Müşteri'),
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
    const tax = digits(buyer.taxNumber);
    const isCompany = buyer.isCorporate || tax.length === 10;
    const nihai = isNihaiTuketiciTaxId(tax);
    const desiredName =
      buyer.name?.trim() ||
      (isCompany ? 'Kurumsal Müşteri' : 'Bireysel Müşteri');
    const existingName = String(attrs.name ?? '').trim();
    const needsName = existingName !== desiredName;
    const needsAddress =
      !attrs.city ||
      !attrs.district ||
      !attrs.address ||
      (!nihai && !digits(String(attrs.tax_number ?? '')));

    // Her zaman güncel alıcı adını yaz — e-Arşiv PDF kontakt adını kullanır
    if (needsName || needsAddress || buyer.email?.trim()) {
      await parasutRequest(config, `/contacts/${existing.id}`, {
        method: 'PUT',
        body: {
          data: {
            id: existing.id,
            type: 'contacts',
            attributes: {
              name: desiredName,
              ...(buyer.email?.trim()
                ? { email: buyer.email.trim() }
                : {}),
              address: buyer.address?.trim() || 'Türkiye',
              district: 'Merkez',
              city: 'İstanbul',
              country: 'Türkiye',
              tax_number: isCompany
                ? tax.length === 10
                  ? tax
                  : undefined
                : nihai || tax.length !== 11
                  ? GIB_NIHAI_TUKETICI_TAX_ID
                  : tax
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
