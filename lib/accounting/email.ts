import { prisma } from '@/lib/db/prisma';
import { companyLegal } from '@/lib/config/company';
import {
  getSenderForTemplate,
  isEmailConfigured,
  type EmailSenderKind
} from '@/lib/config/email';
import { buildInvoiceEmail } from '@/lib/email/invoice-template';
import { sendEmail } from '@/lib/email/resend';
import { logAccountingAudit } from '@/lib/accounting/audit';

export async function queueEmail(params: {
  to: string;
  subject: string;
  template: string;
  html: string;
  orderId?: string;
  invoiceId?: string;
  sender?: EmailSenderKind;
}): Promise<{ id: string; status: string; messageId?: string }> {
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

  if (!isEmailConfigured()) {
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        metadata: { mode: 'log_only', note: 'RESEND_API_KEY yapılandırılmadı' }
      }
    });
    if (process.env.NODE_ENV !== 'production') {
      console.info('[email:queue]', {
        to: params.to,
        subject: params.subject,
        template: params.template
      });
    }
    return { id: delivery.id, status: 'sent' };
  }

  const sender = params.sender ?? getSenderForTemplate(params.template);

  try {
    const result = await sendEmail({
      to: params.to,
      subject: params.subject,
      html: params.html,
      sender,
      replyTo: companyLegal.email
    });

    if (!result.ok) {
      throw new Error(result.error ?? 'Resend gönderimi başarısız');
    }

    const messageId = result.messageId ?? `local-${delivery.id}`;
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: { status: 'sent', sentAt: new Date(), messageId }
    });
    await logAccountingAudit({
      action: 'email.sent',
      entityType: 'email_delivery',
      entityId: delivery.id,
      after: {
        to: params.to,
        template: params.template,
        messageId,
        sender
      }
    });
    return { id: delivery.id, status: 'sent', messageId };
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
      after: { error: message, template: params.template }
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
  buyerName?: string;
  eventTitle?: string;
  issuedAt?: Date;
}) {
  const html = buildInvoiceEmail({
    buyerName: params.buyerName ?? 'Değerli Müşterimiz',
    invoiceNumber: params.invoiceNumber,
    totalGross: params.totalGross,
    currency: params.currency,
    eventTitle: params.eventTitle,
    orderNumber: params.orderId.slice(0, 8).toUpperCase(),
    issuedAt: params.issuedAt
  });

  return queueEmail({
    to: params.to,
    subject: `Faturanız — ${params.invoiceNumber}`,
    template: 'invoice_issued',
    html,
    orderId: params.orderId,
    invoiceId: params.invoiceId,
    sender: 'invoice'
  });
}
