import { emailConfig } from '@/lib/config/email';
import {
  emailAccentBar,
  emailFooter,
  emailLogoBar,
  emailShell,
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

  const reasonBlock = params.reason?.trim()
    ? `
      <tr>
        <td style="padding:0 28px 16px;">
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">İade gerekçesi</p>
          <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.75);line-height:1.5;">${params.reason.trim()}</p>
        </td>
      </tr>`
    : '';

  const ticketsBlock = params.ticketsUrl
    ? `
      <tr>
        <td style="padding:0 28px 28px;" align="center">
          <a href="${params.ticketsUrl}"
             style="display:inline-block;padding:14px 28px;background:#f5a623;color:#0c1017;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;">
            Biletlerime Git
          </a>
        </td>
      </tr>`
    : '';

  const content = `
    ${emailLogoBar()}
    ${emailAccentBar()}
    <tr>
      <td style="padding:28px 28px 8px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;">İade işleminiz tamamlandı</h1>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">
          Merhaba ${params.customerName || 'Değerli Müşterimiz'}, <strong style="color:#fff;">${params.eventTitle}</strong> etkinliğine ait siparişiniz için iade işlemi gerçekleştirildi.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td style="padding:20px;">
              <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.45);">Sipariş No</p>
              <p style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.85);font-family:monospace;">${params.orderNumber}</p>
              <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.45);">İade tutarı</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">${amountLabel}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${reasonBlock}
    <tr>
      <td style="padding:0 28px 16px;">
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">
          Biletleriniz geçersiz kılınmıştır. Ödeme sağlayıcınıza bağlı olarak tutarın hesabınıza yansıması 3–10 iş günü sürebilir.
          Sorularınız için
          <a href="mailto:${emailConfig.supportEmail}" style="color:#f5a623;text-decoration:none;">${emailConfig.supportEmail}</a>.
        </p>
      </td>
    </tr>
    ${ticketsBlock}
    ${emailFooter()}`;

  return emailShell(content);
}
