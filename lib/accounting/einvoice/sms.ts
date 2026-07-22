import type { Invoice, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { logAccountingAudit } from '@/lib/accounting/audit';
import { getEInvoiceConfig } from '@/lib/accounting/einvoice/config';
import { getEInvoiceProvider } from '@/lib/accounting/einvoice/provider';
import { readEInvoiceMeta } from '@/lib/accounting/einvoice/meta';
import type { InvoiceEInvoiceMeta } from '@/lib/accounting/einvoice/types';
import { sendInvoiceEmail } from '@/lib/accounting/email';

export { readEInvoiceMeta } from '@/lib/accounting/einvoice/meta';

async function persistMeta(
  invoice: Invoice,
  patch: Partial<InvoiceEInvoiceMeta>
) {
  const meta =
    invoice.metadata &&
    typeof invoice.metadata === 'object' &&
    !Array.isArray(invoice.metadata)
      ? { ...(invoice.metadata as Record<string, unknown>) }
      : {};
  const prev = readEInvoiceMeta(invoice.metadata);
  const next: InvoiceEInvoiceMeta = {
    provider: patch.provider ?? prev.provider ?? 'gib',
    status: patch.status ?? prev.status ?? 'pending',
    ...prev,
    ...patch
  };
  meta.einvoice = next;
  return prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      eInvoiceUuid: next.uuid ?? next.ettn ?? invoice.eInvoiceUuid,
      metadata: meta as Prisma.InputJsonValue
    }
  });
}

export async function startInvoiceSmsSign(invoiceId: string): Promise<{
  ok: boolean;
  oid?: string;
  phoneMasked?: string;
  error?: string;
}> {
  const config = getEInvoiceConfig();
  const provider = getEInvoiceProvider(config);
  if (!provider?.startSmsSign) {
    return { ok: false, error: 'Bu provider SMS imzayı desteklemiyor' };
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { ok: false, error: 'Fatura bulunamadı' };

  const einv = readEInvoiceMeta(invoice.metadata);
  const ettn = invoice.eInvoiceUuid ?? einv.uuid ?? einv.ettn;
  if (!ettn) {
    return { ok: false, error: 'GİB ETTN yok — önce taslağı gönderin' };
  }

  const result = await provider.startSmsSign([ettn]);
  if (!result.ok || !result.oid) {
    return { ok: false, error: result.error ?? 'SMS başlatılamadı' };
  }

  await persistMeta(invoice, {
    smsOid: result.oid,
    smsPhoneMasked: result.phoneMasked,
    needsSmsSign: true,
    lastError: undefined
  });

  await logAccountingAudit({
    action: 'einvoice.sms_started',
    entityType: 'invoice',
    entityId: invoice.id,
    after: { oid: result.oid, phoneMasked: result.phoneMasked }
  });

  return {
    ok: true,
    oid: result.oid,
    phoneMasked: result.phoneMasked
  };
}

export async function confirmInvoiceSmsSign(params: {
  invoiceId: string;
  code: string;
  oid?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const config = getEInvoiceConfig();
  const provider = getEInvoiceProvider(config);
  if (!provider?.completeSmsSign) {
    return { ok: false, error: 'Bu provider SMS imzayı desteklemiyor' };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: {
      user: { select: { email: true } },
      order: { select: { id: true, attendeeEmail: true, event: { select: { title: true } } } }
    }
  });
  if (!invoice) return { ok: false, error: 'Fatura bulunamadı' };

  const einv = readEInvoiceMeta(invoice.metadata);
  const ettn = invoice.eInvoiceUuid ?? einv.uuid ?? einv.ettn;
  const oid = params.oid?.trim() || einv.smsOid;
  if (!ettn || !oid) {
    return { ok: false, error: 'Önce SMS gönderin (OID/ETTN eksik)' };
  }

  const result = await provider.completeSmsSign({
    oid,
    code: params.code.trim(),
    ettns: [ettn]
  });

  if (!result.ok) {
    await persistMeta(invoice, { lastError: result.error });
    await logAccountingAudit({
      action: 'einvoice.sms_failed',
      entityType: 'invoice',
      entityId: invoice.id,
      after: { error: result.error }
    });
    return { ok: false, error: result.error };
  }

  let pdfUrl = einv.pdfUrl;
  if (provider.getPdf) {
    const pdf = await provider.getPdf(ettn, { signed: true });
    if (pdf.ok && pdf.pdfUrl) pdfUrl = pdf.pdfUrl;
  }

  await persistMeta(invoice, {
    status: 'accepted',
    needsSmsSign: false,
    smsOid: undefined,
    signedAt: new Date().toISOString(),
    pdfUrl,
    lastError: undefined
  });

  await logAccountingAudit({
    action: 'einvoice.sms_signed',
    entityType: 'invoice',
    entityId: invoice.id,
    after: { ettn, status: 'accepted' }
  });

  const to = invoice.user.email ?? invoice.order.attendeeEmail;
  if (to) {
    await sendInvoiceEmail({
      to,
      invoiceNumber: invoice.invoiceNumber,
      totalGross: invoice.totalGross,
      currency: invoice.currency,
      orderId: invoice.order.id,
      invoiceId: invoice.id,
      buyerName: invoice.buyerName,
      eventTitle: invoice.order.event?.title,
      issuedAt: invoice.issuedAt,
      gibSigned: true,
      gibStatusNote: 'e-Arşiv belgeniz GİB üzerinde onaylanmıştır.'
    });
  }

  return { ok: true };
}
