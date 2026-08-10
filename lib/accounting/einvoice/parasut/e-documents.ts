import type { ParasutConfig } from '@/lib/accounting/einvoice/parasut/config';
import {
  asResourceList,
  asSingleResource,
  attrString,
  parasutRequest,
  type JsonApiDocument,
  type JsonApiResource
} from '@/lib/accounting/einvoice/parasut/client';
import type { EInvoiceDocumentKind } from '@/lib/accounting/einvoice/types';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitTrackableJob(
  config: ParasutConfig,
  jobId: string
): Promise<JsonApiResource> {
  const started = Date.now();
  while (Date.now() - started < config.jobTimeoutMs) {
    const doc = await parasutRequest(config, `/trackable_jobs/${jobId}`);
    const job = asSingleResource(doc);
    const status = (attrString(job, 'status') ?? '').toLowerCase();
    if (status === 'done' || status === 'finished' || status === 'completed') {
      if (!job) throw new Error('Paraşüt job yanıtı boş');
      return job;
    }
    if (status === 'error' || status === 'failed') {
      const errors = job?.attributes?.errors;
      const msg = Array.isArray(errors)
        ? errors.map(String).join('; ')
        : attrString(job, 'errors') || 'Paraşüt e-belge job başarısız';
      throw new Error(msg);
    }
    await sleep(config.jobPollMs);
  }
  throw new Error('Paraşüt e-belge job zaman aşımı');
}

/**
 * e-Fatura mükellef kutusu — VKN kayıtlıysa inbox adresi döner.
 */
export async function findEInvoiceInboxAddress(
  config: ParasutConfig,
  taxNumber: string
): Promise<string | null> {
  const vkn = taxNumber.replace(/\D/g, '');
  if (vkn.length !== 10) return null;
  try {
    const doc = await parasutRequest(config, '/e_invoice_inboxes', {
      query: {
        'filter[vkn]': vkn,
        'page[number]': 1,
        'page[size]': 15
      }
    });
    const hit = asResourceList(doc)[0];
    return (
      attrString(hit, 'e_invoice_address') ??
      attrString(hit, 'address') ??
      null
    );
  } catch {
    return null;
  }
}

export async function createEDocumentFromSalesInvoice(
  config: ParasutConfig,
  params: {
    salesInvoiceId: string;
    kind: EInvoiceDocumentKind;
    eInvoiceTo?: string | null;
  }
): Promise<{ job: JsonApiResource; documentType: 'e_archives' | 'e_invoices' }> {
  const useEfatura =
    params.kind === 'e_fatura' || Boolean(params.eInvoiceTo);

  if (useEfatura) {
    const body = {
      data: {
        type: 'e_invoices',
        attributes: {
          scenario: 'basic',
          to: params.eInvoiceTo || undefined
        },
        relationships: {
          invoice: {
            data: { id: params.salesInvoiceId, type: 'sales_invoices' }
          }
        }
      }
    };
    const doc = await parasutRequest(config, '/e_invoices', {
      method: 'POST',
      body
    });
    const job = asSingleResource(doc);
    if (!job?.id) throw new Error('Paraşüt e-Fatura job oluşturulamadı');
    return { job, documentType: 'e_invoices' };
  }

  const body = {
    data: {
      type: 'e_archives',
      relationships: {
        sales_invoice: {
          data: { id: params.salesInvoiceId, type: 'sales_invoices' }
        }
      }
    }
  };
  const doc = await parasutRequest(config, '/e_archives', {
    method: 'POST',
    body
  });
  const job = asSingleResource(doc);
  if (!job?.id) throw new Error('Paraşüt e-Arşiv job oluşturulamadı');
  return { job, documentType: 'e_archives' };
}

export async function getEDocumentPdfUrl(
  config: ParasutConfig,
  documentType: 'e_archives' | 'e_invoices',
  documentId: string
): Promise<string | null> {
  try {
    const doc = await parasutRequest(
      config,
      `/${documentType}/${documentId}/pdf`
    );
    // Some responses wrap URL in trackable job or attributes.url
    const single = asSingleResource(doc);
    const url =
      attrString(single, 'url') ??
      (typeof single?.attributes?.url === 'string'
        ? single.attributes.url
        : null);
    if (url) return url;

    // Async pdf job
    if (single?.type === 'trackable_jobs' && single.id) {
      const job = await waitTrackableJob(config, single.id);
      return attrString(job, 'url');
    }
  } catch {
    // fall through
  }
  return null;
}

export async function showEDocument(
  config: ParasutConfig,
  documentType: 'e_archives' | 'e_invoices',
  documentId: string
): Promise<JsonApiResource | null> {
  const doc = await parasutRequest(config, `/${documentType}/${documentId}`, {
    query: { include: 'sales_invoice' }
  });
  return asSingleResource(doc);
}

/** E-belgeyi e-posta ile paylaş */
export async function shareSalesInvoiceEmail(
  config: ParasutConfig,
  params: {
    salesInvoiceId: string;
    email: string;
    subject?: string;
    body?: string;
  }
): Promise<JsonApiDocument> {
  return parasutRequest(config, '/sharings', {
    method: 'POST',
    body: {
      data: {
        type: 'sharings',
        attributes: {
          email: {
            addresses: params.email,
            subject: params.subject ?? 'BiletFeed Faturanız',
            body:
              params.body ??
              'BiletFeed sipariş faturanız ektedir. Bu e-posta Paraşüt üzerinden gönderilmiştir.'
          }
        },
        relationships: {
          shareable: {
            data: {
              id: params.salesInvoiceId,
              type: 'sales_invoices'
            }
          }
        }
      }
    }
  });
}

export function extractJobResultId(job: JsonApiResource): string | null {
  const result = job.attributes?.result;
  if (typeof result === 'string' && /^\d+$/.test(result)) return result;
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    const id = (result as Record<string, unknown>).id;
    if (typeof id === 'string' || typeof id === 'number') return String(id);
  }
  // Some jobs put created resource id on job itself after done
  return job.id && job.type !== 'trackable_jobs' ? job.id : null;
}
