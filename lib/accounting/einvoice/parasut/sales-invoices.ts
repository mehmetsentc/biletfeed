import type { ParasutConfig } from '@/lib/accounting/einvoice/parasut/config';
import {
  asSingleResource,
  attrString,
  parasutRequest,
  type JsonApiResource
} from '@/lib/accounting/einvoice/parasut/client';
import type { EInvoicePayload } from '@/lib/accounting/einvoice/types';

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Net birim fiyat (Paraşüt unit_price KDV hariç) */
export function buildSalesInvoiceBody(params: {
  payload: EInvoicePayload;
  contactId: string;
  productId: string;
  itemType?: 'invoice' | 'refund';
  paymentAccountId?: string | null;
}): unknown {
  const { payload, contactId, productId } = params;
  const itemType = params.itemType ?? 'invoice';
  const issueDate = ymd(payload.issuedAt);
  const paymentAccountId = (params.paymentAccountId ?? '').trim();
  const cashSale = Boolean(paymentAccountId);

  return {
    data: {
      type: 'sales_invoices',
      attributes: {
        item_type: itemType,
        description: `BiletFeed ${payload.invoiceNumber}`,
        issue_date: issueDate,
        due_date: issueDate,
        currency: payload.currency === 'TRY' ? 'TRL' : payload.currency,
        invoice_note: payload.invoiceNumber,
        order_no: payload.invoiceNumber,
        order_date: issueDate,
        cash_sale: cashSale,
        ...(cashSale
          ? {
              payment_account_id: Number.isFinite(Number(paymentAccountId))
                ? Number(paymentAccountId)
                : paymentAccountId,
              payment_date: issueDate,
              payment_description: `BiletFeed ${payload.invoiceNumber}`
            }
          : {}),
        tax_number: payload.buyer.taxNumber
          ? payload.buyer.taxNumber.replace(/\D/g, '')
          : undefined,
        tax_office: payload.buyer.taxOffice ?? undefined,
        billing_address: payload.buyer.address ?? undefined,
        city: undefined,
        country: 'Türkiye'
      },
      relationships: {
        contact: {
          data: { id: contactId, type: 'contacts' }
        },
        details: {
          data: payload.lines.map((line, index) => ({
            type: 'sales_invoice_details',
            attributes: {
              quantity: line.quantity,
              unit_price: Number(line.unitPriceNet.toFixed(4)),
              vat_rate: line.vatRate,
              description: line.description.slice(0, 255),
              discount_type: 'percentage',
              discount_value: 0,
              detail_no: index + 1
            },
            relationships: {
              product: {
                data: { id: productId, type: 'products' }
              }
            }
          }))
        }
      }
    }
  };
}

export async function createSalesInvoice(
  config: ParasutConfig,
  params: {
    payload: EInvoicePayload;
    contactId: string;
    productId: string;
    itemType?: 'invoice' | 'refund';
  }
): Promise<JsonApiResource> {
  const doc = await parasutRequest(config, '/sales_invoices', {
    method: 'POST',
    query: { include: 'details,contact' },
    body: buildSalesInvoiceBody({
      ...params,
      paymentAccountId: config.paymentAccountId
    })
  });
  const created = asSingleResource(doc);
  if (!created?.id) throw new Error('Paraşüt satış faturası oluşturulamadı');
  return created;
}

export async function showSalesInvoice(
  config: ParasutConfig,
  id: string
): Promise<JsonApiResource | null> {
  const doc = await parasutRequest(config, `/sales_invoices/${id}`, {
    query: { include: 'active_e_document' }
  });
  return asSingleResource(doc);
}

export function salesInvoiceNo(resource: JsonApiResource): string | null {
  return attrString(resource, 'invoice_no');
}
