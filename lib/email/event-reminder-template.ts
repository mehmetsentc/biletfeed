import { emailConfig } from '@/lib/config/email';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailEsc as esc,
  emailFooter,
  emailInfoGrid,
  emailLogoBar,
  emailPrimaryButton,
  emailSecondaryLink,
  emailShell
} from '@/lib/email/email-shared';

export interface EventReminderEmailParams {
  customerName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  eventCity: string;
  coverImage?: string;
  ticketsUrl: string;
  eventUrl: string;
  calendarUrl?: string;
  daysUntil: number;
}

/**
 * Etkinlik hatırlatma e-postası — cron job ile gönderilmeye hazır yapı.
 * Önerilen cron: etkinlikten 24 saat önce `sendEventReminderEmails()`.
 */
export function buildEventReminderEmail(params: EventReminderEmailParams): string {
  const whenLabel =
    params.daysUntil <= 0
      ? 'Bugün'
      : params.daysUntil === 1
        ? 'Yarın'
        : `${params.daysUntil} gün sonra`;

  const locationLine = [params.eventVenue, params.eventCity]
    .filter(Boolean)
    .join(', ');

  const preheader = `${params.eventTitle} — ${whenLabel}. ${params.eventDate}`;

  const coverBlock = params.coverImage
    ? `
      <tr>
        <td style="padding:0;">
          <img src="${esc(params.coverImage)}" alt="${esc(params.eventTitle)}"
               width="560" height="200"
               style="display:block;width:100%;max-height:200px;object-fit:cover;border:0;" />
        </td>
      </tr>`
    : '';

  const calendarButton = params.calendarUrl
    ? `
      <a href="${params.calendarUrl}"
         style="display:inline-block;margin-left:12px;padding:14px 22px;background:${EMAIL_BRAND.cardBg};color:${EMAIL_BRAND.text};font-size:14px;font-weight:600;text-decoration:none;border-radius:999px;border:1px solid ${EMAIL_BRAND.border};">
        Takvime Ekle
      </a>`
    : '';

  const content = `
    ${emailLogoBar()}
    ${coverBlock}
    ${emailAccentBar()}
    <tr>
      <td style="padding:28px 28px 8px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${EMAIL_BRAND.accentDark};">
          Etkinlik hatırlatması · ${esc(whenLabel)}
        </p>
        <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:${EMAIL_BRAND.text};line-height:1.3;">
          ${esc(params.eventTitle)}
        </h1>
        <p style="margin:0;font-size:15px;color:${EMAIL_BRAND.textSecondary};line-height:1.65;">
          Merhaba ${esc(params.customerName || 'Değerli Müşterimiz')}, etkinliğiniz yaklaşıyor.
          Biletinizi yanınızda bulundurmayı unutmayın.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="background:${EMAIL_BRAND.pageBg};border-radius:14px;border:1px solid ${EMAIL_BRAND.border};">
          <tr>
            <td style="padding:20px 22px;">
              ${emailInfoGrid([
                { label: 'Tarih & Saat', value: params.eventDate, icon: '📅' },
                { label: 'Konum', value: locationLine || 'Belirtilecek', icon: '📍' }
              ])}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 28px;" align="center">
        ${emailPrimaryButton(params.ticketsUrl, 'Biletimi Görüntüle')}
        ${calendarButton}
        <p style="margin:18px 0 0;font-size:14px;">
          ${emailSecondaryLink(params.eventUrl, 'Etkinlik detayları')}
        </p>
      </td>
    </tr>
    ${emailFooter({
      note: `Sorularınız için ${emailConfig.supportEmail}`
    })}`;

  return emailShell(content, preheader);
}
