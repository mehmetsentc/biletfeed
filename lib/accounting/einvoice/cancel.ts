import type { Prisma } from '@prisma/client';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { logAccountingAudit } from '@/lib/accounting/audit';
import { getEInvoiceConfig } from '@/lib/accounting/einvoice/config';
import { resolveProviderForKind } from '@/lib/accounting/einvoice/provider';
import { readEInvoiceMeta } from '@/lib/accounting/einvoice/meta';
import type {
  EInvoiceDocumentKind,
  InvoiceEInvoiceMeta
} from '@/lib/accounting/einvoice/types';

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

function mapKind(type: string): EInvoiceDocumentKind {
  if (type === 'e_fatura') return 'e_fatura';
  if (type === 'credit_note') return 'credit_note';
  return 'e_arsiv';
}

/**
 * Kanal üzerinden iptal / taslak silme.
 * - e-Arşiv: portal iptal (stub veya silme komutu)
 * - e-Fatura: gateway cancel (mock’ta yerel işaret)
 * Invoice.status → cancelled
 */
export async function cancelInvoiceOnChannel(params: {
  invoiceId: string;
  actorId?: string | null;
  reason?: string;
}): Promise<{
  ok: boolean;
  error?: string;
  mock?: boolean;
  status?: string;
}> {
  await ensureDbConnection();

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId }
  });
  if (!invoice) {
    return { ok: false, error: 'Fatura bulunamadı' };
  }
  if (invoice.status === 'cancelled') {
    return { ok: true, status: 'cancelled' };
  }

  const einv = readEInvoiceMeta(invoice.metadata);
  const uuid = invoice.eInvoiceUuid ?? einv.uuid ?? einv.ettn;
  const kind = mapKind(invoice.type);
  const config = getEInvoiceConfig();
  const provider = resolveProviderForKind(kind, config);

  let channelResult: { ok: boolean; error?: string; mock?: boolean } = {
    ok: true,
    mock: true
  };

  if (uuid && provider?.cancel) {
    channelResult = await provider.cancel(uuid, {
      reason: params.reason,
      signed: einv.status === 'accepted' && !einv.needsSmsSign
    });
  } else if (!uuid) {
    // Henüz kanala gitmemiş — yalnızca yerel iptal
    channelResult = { ok: true, mock: Boolean(provider?.name === 'mock') };
  } else if (!provider?.cancel) {
    channelResult = {
      ok: false,
      error: 'Bu kanalda iptal API’si yok — GİB portalından iptal edin'
    };
  }

  if (!channelResult.ok) {
    await logAccountingAudit({
      action: 'einvoice.cancel.failed',
      entityType: 'invoice',
      entityId: invoice.id,
      actorId: params.actorId,
      actorRole: 'admin',
      after: { error: channelResult.error, uuid }
    });
    return {
      ok: false,
      error: channelResult.error ?? 'İptal başarısız'
    };
  }

  const meta = asRecord(invoice.metadata);
  const nextEinv: InvoiceEInvoiceMeta = {
    ...(einv as InvoiceEInvoiceMeta),
    provider: (einv.provider as InvoiceEInvoiceMeta['provider']) ?? 'none',
    status: 'rejected',
    cancelledAt: new Date().toISOString(),
    cancelReason: params.reason ?? 'admin_cancel',
    needsSmsSign: false,
    lastError: undefined,
    mock: channelResult.mock ?? einv.mock,
    channel: einv.channel,
    dispatchStatus: 'rejected'
  };
  meta.einvoice = nextEinv;

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      metadata: meta as Prisma.InputJsonValue
    }
  });

  await logAccountingAudit({
    action: 'einvoice.cancelled',
    entityType: 'invoice',
    entityId: invoice.id,
    actorId: params.actorId,
    actorRole: 'admin',
    after: {
      uuid,
      channel: provider?.channelId,
      mock: channelResult.mock,
      reason: params.reason
    }
  });

  return {
    ok: true,
    mock: channelResult.mock,
    status: 'cancelled'
  };
}
