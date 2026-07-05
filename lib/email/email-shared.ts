import { brandTheme } from '@/lib/config/brand-theme';
import { emailHeaderLogoSrc } from '@/lib/brand/embed-logo';
import { companyLegal } from '@/lib/config/company';
import { platformContact } from '@/lib/config/contact';
import { getSiteUrl } from '@/lib/config/domain';
import { formatTurkeyDateTimeLong } from '@/lib/datetime/istanbul';

/** Transactional e-postalar — açık tema (teslimat ve okunabilirlik için) */
export const EMAIL_BRAND = {
  pageBg: '#F4F4F5',
  cardBg: '#FFFFFF',
  headerBg: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#52525B',
  textMuted: '#71717A',
  border: '#E4E4E7',
  accent: brandTheme.orange,
  accentDark: brandTheme.orangeHover,
  accentSoft: brandTheme.orangeSoft,
  success: '#059669'
} as const;

export function emailLogoUrl(): string {
  return emailHeaderLogoSrc();
}

export function formatEventDateTimeTr(startDate: Date): string {
  return formatTurkeyDateTimeLong(startDate);
}

export function formatCurrencyTr(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(amount);
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function emailPreheader(text: string): string {
  const padded = `${esc(text)}${'&nbsp;'.repeat(80)}`;
  return `
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${EMAIL_BRAND.pageBg};">
      ${padded}
    </div>`;
}

export function emailLogoBar(): string {
  const logoUrl = emailLogoUrl();
  const homeUrl = getSiteUrl('/');

  return `
    <tr>
      <td style="padding:24px 28px 16px;background:${EMAIL_BRAND.headerBg};">
        <a href="${homeUrl}" style="text-decoration:none;display:inline-block;line-height:0;">
          <img src="${logoUrl}" alt="BiletFeed" width="148" height="40"
               style="display:block;width:148px;height:auto;max-height:40px;border:0;outline:none;" />
        </a>
      </td>
    </tr>`;
}

export function emailAccentBar(): string {
  return `
    <tr>
      <td style="padding:0 28px;background:${EMAIL_BRAND.headerBg};">
        <div style="height:4px;border-radius:4px;background:linear-gradient(90deg,${EMAIL_BRAND.accent},${EMAIL_BRAND.accentDark});"></div>
      </td>
    </tr>`;
}

export function emailPrimaryButton(href: string, label: string): string {
  return `
    <a href="${href}"
       style="display:inline-block;padding:14px 28px;background:${EMAIL_BRAND.accent};color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;letter-spacing:0.2px;">
      ${esc(label)}
    </a>`;
}

export function emailSecondaryLink(href: string, label: string): string {
  return `
    <a href="${href}" style="color:${EMAIL_BRAND.accentDark};font-size:14px;font-weight:600;text-decoration:underline;">
      ${esc(label)}
    </a>`;
}

export function emailInfoGrid(
  rows: Array<{ label: string; value: string; icon?: string }>
): string {
  const cells = rows
    .map(
      (row) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BRAND.border};">
          <p style="margin:0 0 2px;font-size:11px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:${EMAIL_BRAND.textMuted};">
            ${row.icon ? `${row.icon} ` : ''}${esc(row.label)}
          </p>
          <p style="margin:0;font-size:15px;font-weight:600;color:${EMAIL_BRAND.text};line-height:1.45;">
            ${esc(row.value)}
          </p>
        </td>
      </tr>`
    )
    .join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px;">
      ${cells}
    </table>`;
}

export function emailFooter(params?: {
  organizerName?: string;
  note?: string;
}): string {
  const supportLine = `${platformContact.email}`;
  const organizerLine = params?.organizerName
    ? `<p style="margin:0 0 8px;font-size:12px;color:${EMAIL_BRAND.textMuted};text-align:center;line-height:1.5;">
         Organizatör: ${esc(params.organizerName)}
       </p>`
    : '';

  return `
    <tr>
      <td style="padding:20px 28px 24px;background:${EMAIL_BRAND.pageBg};border-top:1px solid ${EMAIL_BRAND.border};">
        ${organizerLine}
        <p style="margin:0 0 6px;font-size:12px;color:${EMAIL_BRAND.textMuted};text-align:center;line-height:1.6;">
          Yardım: <a href="mailto:${supportLine}" style="color:${EMAIL_BRAND.accentDark};text-decoration:none;">${supportLine}</a>
          · ${esc(platformContact.supportHours)}
        </p>
        <p style="margin:0 0 6px;font-size:11px;color:${EMAIL_BRAND.textMuted};text-align:center;line-height:1.5;">
          ${esc(companyLegal.tradeName)} · ${esc(companyLegal.address)}
        </p>
        <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.textMuted};text-align:center;">
          <a href="${getSiteUrl('/')}" style="color:${EMAIL_BRAND.textMuted};text-decoration:none;">biletfeed.com</a>
        </p>
        ${
          params?.note
            ? `<p style="margin:12px 0 0;font-size:11px;color:${EMAIL_BRAND.textMuted};text-align:center;line-height:1.55;">
                 ${esc(params.note)}
               </p>`
            : ''
        }
      </td>
    </tr>`;
}

export function emailShell(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="tr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>BiletFeed</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.pageBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? emailPreheader(preheader) : ''}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:${EMAIL_BRAND.pageBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:560px;background:${EMAIL_BRAND.cardBg};border-radius:16px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export { esc as emailEsc };
