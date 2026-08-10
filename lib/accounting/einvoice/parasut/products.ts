import type { ParasutConfig } from '@/lib/accounting/einvoice/parasut/config';
import {
  asResourceList,
  asSingleResource,
  parasutRequest
} from '@/lib/accounting/einvoice/parasut/client';

export async function ensureProductId(config: ParasutConfig): Promise<string> {
  if (config.defaultProductId) return config.defaultProductId;

  const listed = await parasutRequest(config, '/products', {
    query: {
      'filter[code]': config.productCode,
      'page[number]': 1,
      'page[size]': 15
    }
  });
  const hit = asResourceList(listed)[0];
  if (hit?.id) return hit.id;

  const created = await parasutRequest(config, '/products', {
    method: 'POST',
    body: {
      data: {
        type: 'products',
        attributes: {
          name: 'BiletFeed Etkinlik Bileti',
          code: config.productCode,
          vat_rate: Number(process.env.ACCOUNTING_VAT_RATE ?? 20) || 20,
          unit: 'Adet',
          currency: 'TRL'
        }
      }
    }
  });
  const resource = asSingleResource(created);
  if (!resource?.id) throw new Error('Paraşüt ürün oluşturulamadı');
  return resource.id;
}
