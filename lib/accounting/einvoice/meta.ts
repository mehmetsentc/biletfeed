import type { InvoiceEInvoiceMeta } from '@/lib/accounting/einvoice/types';

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

export function readEInvoiceMeta(
  metadata: unknown
): Partial<InvoiceEInvoiceMeta> {
  return asRecord(asRecord(metadata).einvoice) as Partial<InvoiceEInvoiceMeta>;
}
