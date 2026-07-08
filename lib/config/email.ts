import { companyLegal } from '@/lib/config/company';

const DEFAULT_DOMAIN = 'biletfeed.com';

/** E-posta gönderen türleri — Resend'de doğrulanmış adreslerle eşleşmeli */
export type EmailSenderKind =
  | 'default'
  | 'tickets'
  | 'invitation'
  | 'invoice'
  | 'noreply';

export const emailConfig = {
  /** Gönderen görünen adı — "BiletFeed <tickets@...>" formatında kullanılır */
  fromName: process.env.RESEND_FROM_NAME?.trim() || 'BiletFeed',

  /** Yanıt adresi — destek ekibine yönlendirilir */
  replyTo:
    process.env.RESEND_REPLY_TO?.trim() ||
    process.env.RESEND_SUPPORT_EMAIL?.trim() ||
    companyLegal.email,

  /** Destek e-postası — şablonlarda gösterilir */
  supportEmail:
    process.env.RESEND_SUPPORT_EMAIL?.trim() || companyLegal.email,

  /** Doğrulanmış gönderen adresleri (biletfeed.com) */
  addresses: {
    /** Varsayılan / bilet işlemleri */
    default:
      process.env.RESEND_FROM_EMAIL?.trim() ||
      process.env.RESEND_TICKETS_FROM?.trim() ||
      `tickets@${DEFAULT_DOMAIN}`,
    tickets:
      process.env.RESEND_TICKETS_FROM?.trim() ||
      process.env.RESEND_FROM_EMAIL?.trim() ||
      `tickets@${DEFAULT_DOMAIN}`,
    invitation:
      process.env.RESEND_INVITATION_FROM?.trim() ||
      `davetiye@${DEFAULT_DOMAIN}`,
    invoice:
      process.env.RESEND_INVOICE_FROM?.trim() || `fatura@${DEFAULT_DOMAIN}`,
    noreply:
      process.env.RESEND_NOREPLY_FROM?.trim() || `noreply@${DEFAULT_DOMAIN}`
  }
} as const;

/** Şablon → gönderen adresi eşlemesi */
const TEMPLATE_SENDER: Record<string, EmailSenderKind> = {
  ticket_purchase: 'tickets',
  event_invitation: 'invitation',
  event_invitation_bulk: 'invitation',
  invoice_issued: 'invoice',
  order_refund: 'tickets',
  event_reminder: 'tickets',
  event_approved: 'noreply',
  admin_test: 'default'
};

export function getSenderAddress(kind: EmailSenderKind = 'default'): string {
  if (kind === 'default') return emailConfig.addresses.default;
  return emailConfig.addresses[kind];
}

/** Resend API `from` alanı — "BiletFeed <tickets@biletfeed.com>" */
export function formatEmailFrom(kind: EmailSenderKind = 'default'): string {
  const address = getSenderAddress(kind);
  return `${emailConfig.fromName} <${address}>`;
}

export function getSenderForTemplate(template: string): EmailSenderKind {
  return TEMPLATE_SENDER[template] ?? 'default';
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
