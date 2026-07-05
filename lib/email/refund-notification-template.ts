import { emailConfig } from '@/lib/config/email';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailEsc as esc,
  emailFooter,
  emailInfoGrid,
  emailLogoBar,
  emailPrimaryButton,
  emailSectionLabel,
  emailShell,
  emailSummaryBox,
  formatCurrencyTr
} from '@/lib/email/email-shared';

export interface RefundNotificationEmailParams {
  customerName: string;
  eventTitle: string;
  orderNumber: string;
  refundAmount: number;
  currency: string;
  reason?: string;
  ticketsUrl?: string;
}

/** Sipariş iade bildirimi — profesyonel HTML */
export function buildRefundNotificationEmail(
  params: RefundNotificationEmailParams
): string {
  const amountLabel =
    params.currency === 'TRY'
      ? formatCurrencyTr(params.refundAmount)
      : `${params.refundAmount.toFixed(2)} ${params.currency}`;

  const preheader = `${params.eventTitle} — iade tutarı ${amountLabel}`;

  const reasonBlock = params.reason?.trim()
    ? `
      <tr>
        <td style="padding:0 28px 16px;">
          <div style="padding:14px 16px;background:${EMAIL_BRAND.pageBg};border-radius:10px;border-left:3px solid ${EMAIL_BRAND.border};">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:${EMAIL_BRAND.textMuted};">İade gerekçesi</p>
            <p style="margin:0;font-size:14px;color:${EMAIL_BRAND.textSecondary};line-height:1.55;">${esc(params.reason.trim())}</p>
          </div>
        </td>
      </tr>`
    : '';

  const ticketsBlock = params.ticketsUrl
    ? `
      <tr>
        <td style="padding:0 28px 28px;" align="center">
          ${emailPrimaryButton(params.ticketsUrl, 'Biletlerime Git')}
        </td>
      </tr>`
    : '';

  const content = `
    ${emailLogoBar()}
    ${emailAccentBar()}
    <tr>
      <td style="padding:28px 28px 8px;">
        ${emailSectionLabel('İade bildirimi')}
        <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:${EMAIL_BRAND.text};line-height:1.25;">
          İade işleminiz tamamlandı
        </h1>
        <p style="margin:0;font-size:15px;color:${EMAIL_BRAND.textSecondary};line-height:1.65;">
          Merhaba ${esc(params.customerName || 'Değerli Müşterimiz')},
          <strong style="color:${EMAIL_BRAND.text};">${esc(params.eventTitle)}</strong> etkinliğine ait siparişiniz için iade işlemi gerçekleştirildi.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 20px;">
        ${emailSummaryBox(
          emailInfoGrid([
            { label: 'Sipariş No', value: params.orderNumber },
            { label: 'İade tutarı', value: amountLabel }
          ])
        )}
      </td>
    </tr>
    ${reasonBlock}
    <tr>
      <td style="padding:0 28px 16px;">
        <p style="margin:0;font-size:14px;color:${EMAIL_BRAND.textSecondary};line-height:1.65;">
          Biletleriniz geçersiz kılınmıştır. Ödeme sağlayıcınıza bağlı olarak tutarın hesabınıza yansıması 3–10 iş günü sürebilir.
          Sorularınız için
          <a href="mailto:${emailConfig.supportEmail}" style="color:${EMAIL_BRAND.accentDark};text-decoration:none;font-weight:600;">${emailConfig.supportEmail}</a>.
        </p>
      </td>
    </tr>
    ${ticketsBlock}
    ${emailFooter()}`;

  return emailShell(content, preheader);
}
