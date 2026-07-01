import { brandTheme } from '@/lib/config/brand-theme';
import { emailHeaderLogoSrc } from '@/lib/brand/embed-logo';
import { platformContact } from '@/lib/config/contact';
import { getSiteUrl } from '@/lib/config/domain';

export const EMAIL_BRAND = {
  bg: brandTheme.surfaceDark,
  card: brandTheme.surfaceCard,
  header: brandTheme.surfaceElevated,
  accent: brandTheme.orange,
  accentDark: brandTheme.orangeHover
} as const;

/** E-posta istemcileri için logo (gömülü base64 — her zaman görünür) */
export function emailLogoUrl(): string {
  return emailHeaderLogoSrc();
}

export function formatEventDateTimeTr(startDate: Date): string {
  return startDate.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatCurrencyTr(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(amount);
}

export function emailLogoBar(): string {
  const logoUrl = emailLogoUrl();
  const homeUrl = getSiteUrl('/');

  return `
    <tr>
      <td style="padding:20px 28px;background:${EMAIL_BRAND.header};border-bottom:1px solid rgba(255,255,255,0.06);">
        <a href="${homeUrl}" style="text-decoration:none;display:inline-block;line-height:0;">
          <img src="${logoUrl}" alt="BiletFeed" width="160" height="44"
               style="display:block;width:160px;height:auto;max-height:44px;border:0;outline:none;" />
        </a>
      </td>
    </tr>`;
}

export function emailAccentBar(): string {
  return `
    <tr>
      <td>
        <div style="height:3px;background:linear-gradient(90deg,${EMAIL_BRAND.accent},${EMAIL_BRAND.accentDark});"></div>
      </td>
    </tr>`;
}

export function emailFooter(params?: {
  organizerName?: string;
  note?: string;
}): string {
  const supportLine = `${platformContact.email} · ${platformContact.phone}`;
  const organizerLine = params?.organizerName
    ? `<p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.35);text-align:center;">
         Organizatör: ${params.organizerName}
       </p>`
    : '';

  return `
    <tr>
      <td style="padding:16px 28px;background:${EMAIL_BRAND.header};border-top:1px solid rgba(255,255,255,0.06);">
        ${organizerLine}
        <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.35);text-align:center;">
          Destek: ${supportLine} · ${platformContact.supportHours}
        </p>
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);text-align:center;">
          biletfeed.com · Güvenli etkinlik ve bilet platformu
        </p>
        ${
          params?.note
            ? `<p style="margin:10px 0 0;font-size:11px;color:rgba(255,255,255,0.25);text-align:center;line-height:1.5;">
                 ${params.note}
               </p>`
            : ''
        }
      </td>
    </tr>`;
}

export function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>BiletFeed</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.bg};font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:${EMAIL_BRAND.bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:${EMAIL_BRAND.card};border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
