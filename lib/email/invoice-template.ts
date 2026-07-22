import { companyLegal, formatCompanyTaxLine } from '@/lib/config/company';
import { emailConfig } from '@/lib/config/email';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailEsc as esc,
  emailFooter,
  emailInfoGrid,
  emailLogoBar,
  emailSectionLabel,
  emailShell,
  emailSummaryBox,
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
  gibSigned?: boolean;
  gibStatusNote?: string;
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

  const preheader = `Fatura ${params.invoiceNumber} — ${amountLabel}`;

  const infoRows: Array<{ label: string; value: string }> = [
    { label: 'Fatura No', value: params.invoiceNumber },
    { label: 'Tutar (KDV dahil)', value: amountLabel },
    { label: 'Düzenleme tarihi', value: issuedLabel }
  ];
  if (params.eventTitle) {
    infoRows.push({ label: 'Etkinlik', value: params.eventTitle });
  }
  if (params.orderNumber) {
    infoRows.push({ label: 'Sipariş No', value: params.orderNumber });
  }

  const content = `
    ${emailLogoBar()}
    ${emailAccentBar()}
    <tr>
      <td style="padding:28px 28px 8px;">
        ${emailSectionLabel('Fatura')}
        <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:${EMAIL_BRAND.text};line-height:1.25;">
          Faturanız hazır
        </h1>
        <p style="margin:0;font-size:15px;color:${EMAIL_BRAND.textSecondary};line-height:1.65;">
          Merhaba ${esc(params.buyerName || 'Değerli Müşterimiz')}, bilet satın alımınıza ait fatura bilgileri aşağıdadır.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 20px;">
        ${emailSummaryBox(emailInfoGrid(infoRows))}
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 20px;">
        <p style="margin:0;font-size:13px;color:${EMAIL_BRAND.textSecondary};line-height:1.65;">
          <strong style="color:${EMAIL_BRAND.text};">Satıcı:</strong> ${esc(companyLegal.tradeName)}<br/>
          ${esc(formatCompanyTaxLine())}<br/>
          ${esc(companyLegal.address)}
        </p>
      </td>
    </tr>
    ${
      params.gibStatusNote
        ? `<tr>
      <td style="padding:0 28px 20px;">
        <p style="margin:0;padding:12px 14px;border-radius:10px;background:${params.gibSigned ? '#ecfdf5' : '#fffbeb'};font-size:13px;color:${EMAIL_BRAND.text};line-height:1.6;">
          ${esc(params.gibStatusNote)}
        </p>
      </td>
    </tr>`
        : ''
    }
    <tr>
      <td style="padding:0 28px 28px;">
        <p style="margin:0;font-size:14px;color:${EMAIL_BRAND.textMuted};line-height:1.65;">
          Fatura ile ilgili sorularınız için
          <a href="mailto:${emailConfig.supportEmail}" style="color:${EMAIL_BRAND.accentDark};text-decoration:none;font-weight:600;">${emailConfig.supportEmail}</a>
          adresine yazabilirsiniz.
        </p>
      </td>
    </tr>
    ${emailFooter({
      note: params.gibSigned
        ? 'Bu e-posta GİB e-Arşiv onayı sonrası bilgilendirme amaçlıdır.'
        : 'Bu e-posta bilgilendirme amaçlıdır; resmi e-Arşiv onayı muhasebe sürecinde tamamlanır.'
    })}`;

  return emailShell(content, preheader);
}
