import { prisma } from '@/lib/db/prisma';
import { companyLegal } from '@/lib/config/company';
import {
  formatInvitationFrom,
  getSenderForTemplate,
  isEmailConfigured,
  type EmailSenderKind
} from '@/lib/config/email';
import { buildInvoiceEmail } from '@/lib/email/invoice-template';
import { isDeliverableEmail } from '@/lib/email/deliverable';
import { sendEmail } from '@/lib/email/resend';
import { logAccountingAudit } from '@/lib/accounting/audit';

const NON_DELIVERABLE_NOTE =
  'Alıcı adresi geçersiz (sistem içi placeholder — e-posta gönderilmedi)';

export async function queueEmail(params: {
  to: string;
  subject: string;
  template: string;
  html: string;
  text?: string;
  orderId?: string;
  invoiceId?: string;
  sender?: EmailSenderKind;
  /** Gösterilen From adı (davetiyede organizatör) */
  fromDisplayName?: string;
  category?: 'transactional' | 'bulk';
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}): Promise<{ id: string; status: string; messageId?: string; error?: string }> {
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

  if (!isDeliverableEmail(params.to)) {
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'failed',
        errorMessage: NON_DELIVERABLE_NOTE,
        metadata: { reason: 'non_deliverable' }
      }
    });
    return { id: delivery.id, status: 'failed', error: NON_DELIVERABLE_NOTE };
  }

  if (!isEmailConfigured()) {
    const note = 'RESEND_API_KEY yapılandırılmadı';
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'failed',
        errorMessage: note,
        metadata: { mode: 'log_only', note }
      }
    });
    if (process.env.NODE_ENV !== 'production') {
      console.info('[email:queue]', {
        to: params.to,
        subject: params.subject,
        template: params.template,
        note
      });
    }
    return { id: delivery.id, status: 'failed', error: note };
  }

  const sender = params.sender ?? getSenderForTemplate(params.template);
  const isInvitation =
    params.template === 'event_invitation' ||
    params.template === 'event_invitation_bulk';

  try {
    const result = await sendEmail({
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      sender,
      from: isInvitation
        ? formatInvitationFrom(params.fromDisplayName)
        : undefined,
      category: params.category ?? (isInvitation ? 'transactional' : 'transactional'),
      replyTo: params.replyTo ?? companyLegal.email,
      tags: [{ name: 'template', value: params.template }],
      attachments: params.attachments
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
    return { id: delivery.id, status: 'failed', error: message };
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
  gibSigned?: boolean;
  gibStatusNote?: string;
}) {
  const html = buildInvoiceEmail({
    buyerName: params.buyerName ?? 'Değerli Müşterimiz',
    invoiceNumber: params.invoiceNumber,
    totalGross: params.totalGross,
    currency: params.currency,
    eventTitle: params.eventTitle,
    orderNumber: params.orderId.slice(0, 8).toUpperCase(),
    issuedAt: params.issuedAt,
    gibSigned: params.gibSigned,
    gibStatusNote:
      params.gibStatusNote ??
      (params.gibSigned
        ? undefined
        : 'Faturanız sistemimizde oluşturuldu; GİB e-Arşiv onayı muhasebe sürecinde tamamlanır.')
  });

  return queueEmail({
    to: params.to,
    subject: params.gibSigned
      ? `e-Arşiv onaylandı — ${params.invoiceNumber}`
      : `Faturanız — ${params.invoiceNumber}`,
    template: params.gibSigned ? 'invoice_gib_signed' : 'invoice_issued',
    html,
    orderId: params.orderId,
    invoiceId: params.invoiceId,
    sender: 'invoice'
  });
}
