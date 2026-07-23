import type {
  EInvoiceDispatchStatus,
  EInvoiceProviderStatus,
  InvoiceEInvoiceMeta
} from '@/lib/accounting/einvoice/types';

/**
 * Paraşüt-benzeri fatura yaşam döngüsü (satış e-belgesi).
 * DB’de ayrı enum yok; metadata + Invoice.status’tan türetilir.
 */
export type InvoiceLifecycleStatus =
  | 'taslak'
  | 'kuyrukta'
  | 'gonderildi'
  | 'sms_bekliyor'
  | 'kabul'
  | 'red'
  | 'iptal'
  | 'atlandi';

export const LIFECYCLE_LABELS: Record<InvoiceLifecycleStatus, string> = {
  taslak: 'Taslak',
  kuyrukta: 'Kuyrukta',
  gonderildi: 'Gönderildi',
  sms_bekliyor: 'SMS bekliyor',
  kabul: 'Kabul',
  red: 'Red',
  iptal: 'İptal',
  atlandi: 'Atlandı'
};

export function resolveLifecycleStatus(params: {
  invoiceStatus: string;
  einvoice?: Partial<InvoiceEInvoiceMeta> | null;
  eInvoiceUuid?: string | null;
}): InvoiceLifecycleStatus {
  if (params.invoiceStatus === 'cancelled') return 'iptal';

  const einv = params.einvoice ?? {};
  if (einv.cancelledAt) return 'iptal';

  const providerStatus = (einv.status ?? '') as EInvoiceProviderStatus | '';
  const dispatch = einv.dispatchStatus as EInvoiceDispatchStatus | undefined;

  if (einv.needsSmsSign) return 'sms_bekliyor';

  if (providerStatus === 'accepted' || dispatch === 'accepted') return 'kabul';
  if (
    providerStatus === 'rejected' ||
    providerStatus === 'failed' ||
    dispatch === 'rejected' ||
    dispatch === 'error'
  ) {
    return 'red';
  }
  if (providerStatus === 'skipped') return 'atlandi';

  if (
    dispatch === 'queued' ||
    dispatch === 'pending_channel' ||
    providerStatus === 'pending'
  ) {
    return 'kuyrukta';
  }

  if (
    providerStatus === 'submitted' ||
    dispatch === 'sent' ||
    Boolean(params.eInvoiceUuid || einv.uuid)
  ) {
    return 'gonderildi';
  }

  return 'taslak';
}

export function lifecycleBadgeVariant(
  status: InvoiceLifecycleStatus
): 'success' | 'destructive' | 'secondary' | 'outline' {
  if (status === 'kabul') return 'success';
  if (status === 'red' || status === 'iptal') return 'destructive';
  if (status === 'sms_bekliyor' || status === 'kuyrukta') return 'outline';
  return 'secondary';
}
