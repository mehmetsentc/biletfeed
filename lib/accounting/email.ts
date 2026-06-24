import { prisma } from '@/lib/db/prisma';
import { companyLegal } from '@/lib/config/company';
import { logAccountingAudit } from '@/lib/accounting/audit';
import { sendEmail } from '@/lib/email/resend';

function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function queueEmail(params: {
  to: string;
  subject: string;
  template: string;
  html: string;
  orderId?: string;
  invoiceId?: string;
}): Promise<{ id: string; status: string }> {
  const delivery = await prisma.emailDelivery.create({
    data: {
      to: params.to,
      subject: params.subject,
      template: params.template,
      status: 'queued',
      orderId: params.orderId ?? null,
      invoiceId: params.invoiceId ?? null
    }
  });

  if (!emailConfigured()) {
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        metadata: { mode: 'log_only', note: 'RESEND_API_KEY yapılandırılmadı' }
      }
    });
    if (process.env.NODE_ENV !== 'production') {
      console.info('[accounting:email]', {
        to: params.to,
        subject: params.subject,
        template: params.template
      });
    }
    return { id: delivery.id, status: 'sent' };
  }

  try {
    const ok = await sendEmail({
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: companyLegal.email
    });
    if (!ok) throw new Error('Resend gönderimi başarısız');
    const messageId = `resend-${delivery.id}`;
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: { status: 'sent', sentAt: new Date(), messageId }
    });
    await logAccountingAudit({
      action: 'email.sent',
      entityType: 'email_delivery',
      entityId: delivery.id,
      after: { to: params.to, template: params.template }
    });
    return { id: delivery.id, status: 'sent' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: { status: 'failed', errorMessage: message }
    });
    await logAccountingAudit({
      action: 'email.failed',
      entityType: 'email_delivery',
      entityId: delivery.id,
      after: { error: message }
    });
    return { id: delivery.id, status: 'failed' };
  }
}

export async function sendInvoiceEmail(params: {
  to: string;
  invoiceNumber: string;
  totalGross: number;
  currency: string;
  orderId: string;
  invoiceId: string;
}) {
  const html = `
    <div style="font-family:sans-serif;max-width:560px">
      <h2>${companyLegal.brandName} — Fatura</h2>
      <p>Fatura No: <strong>${params.invoiceNumber}</strong></p>
      <p>Tutar: <strong>${params.totalGross.toFixed(2)} ${params.currency}</strong></p>
      <p>${companyLegal.tradeName}<br/>${companyLegal.taxOffice} — ${companyLegal.taxNumber}</p>
    </div>
  `;
  return queueEmail({
    to: params.to,
    subject: `Faturanız — ${params.invoiceNumber}`,
    template: 'invoice_issued',
    html,
    orderId: params.orderId,
    invoiceId: params.invoiceId
  });
}
