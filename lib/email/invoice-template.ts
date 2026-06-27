import { companyLegal, formatCompanyTaxLine } from '@/lib/config/company';
import { emailConfig } from '@/lib/config/email';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailFooter,
  emailLogoBar,
  emailShell,
  formatCurrencyTr
} from '@/lib/email/email-shared';

export interface InvoiceEmailParams {
  buyerName: string;
  invoiceNumber: string;
  totalGross: number;
  currency: string;
  eventTitle?: string;
  orderNumber?: string;
  issuedAt?: Date;
}

/** e-Arşiv / e-Fatura bildirim e-postası — profesyonel HTML */
export function buildInvoiceEmail(params: InvoiceEmailParams): string {
  const issuedLabel = (params.issuedAt ?? new Date()).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const amountLabel =
    params.currency === 'TRY'
      ? formatCurrencyTr(params.totalGross)
      : `${params.totalGross.toFixed(2)} ${params.currency}`;

  const eventBlock = params.eventTitle
    ? `
      <tr>
        <td style="padding:0 28px 8px;">
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">Etkinlik</p>
          <p style="margin:4px 0 0;font-size:15px;color:#fff;font-weight:600;">${params.eventTitle}</p>
        </td>
      </tr>`
    : '';

  const orderBlock = params.orderNumber
    ? `
      <tr>
        <td style="padding:0 28px 16px;">
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">Sipariş No</p>
          <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-family:monospace;">${params.orderNumber}</p>
        </td>
      </tr>`
    : '';

  const content = `
    ${emailLogoBar()}
    ${emailAccentBar()}
    <tr>
      <td style="padding:28px 28px 8px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;">Faturanız hazır</h1>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">
          Merhaba ${params.buyerName || 'Değerli Müşterimiz'}, bilet satın alımınıza ait fatura bilgileri aşağıdadır.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td style="padding:20px;">
              <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.5px;">Fatura No</p>
              <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:${EMAIL_BRAND.accent};font-family:monospace;">${params.invoiceNumber}</p>
              <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.45);">Tutar (KDV dahil)</p>
              <p style="margin:0 0 16px;font-size:24px;font-weight:700;color:#fff;">${amountLabel}</p>
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.45);">Düzenleme tarihi: ${issuedLabel}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${eventBlock}
    ${orderBlock}
    <tr>
      <td style="padding:0 28px 24px;">
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">
          Satıcı: <strong style="color:rgba(255,255,255,0.75);">${companyLegal.tradeName}</strong><br/>
          ${formatCompanyTaxLine()}<br/>
          ${companyLegal.address}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 28px;">
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;">
          Fatura ile ilgili sorularınız için
          <a href="mailto:${emailConfig.supportEmail}" style="color:${EMAIL_BRAND.accent};text-decoration:none;">${emailConfig.supportEmail}</a>
          adresine yazabilirsiniz.
        </p>
      </td>
    </tr>
    ${emailFooter({ note: 'Bu e-posta bilgilendirme amaçlıdır; resmi e-Arşiv kaydınız muhasebe sistemimizde saklanmaktadır.' })}`;

  return emailShell(content);
}
