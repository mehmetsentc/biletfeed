import { emailConfig } from '@/lib/config/email';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailFooter,
  emailLogoBar,
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
  const coverBlock = params.coverImage
    ? `
      <tr>
        <td>
          <img src="${params.coverImage}" alt="${params.eventTitle}"
               width="560" style="display:block;width:100%;height:auto;max-height:200px;object-fit:cover;" />
        </td>
      </tr>`
    : '';

  const whenLabel =
    params.daysUntil <= 0
      ? 'Bugün'
      : params.daysUntil === 1
        ? 'Yarın'
        : `${params.daysUntil} gün sonra`;

  const calendarBlock = params.calendarUrl
    ? `
      <a href="${params.calendarUrl}"
         style="display:inline-block;margin-right:12px;padding:12px 20px;background:rgba(255,255,255,0.08);color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:10px;border:1px solid rgba(255,255,255,0.12);">
        Takvime Ekle
      </a>`
    : '';

  const content = `
    ${emailLogoBar()}
    ${emailAccentBar()}
    ${coverBlock}
    <tr>
      <td style="padding:28px 28px 8px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:${EMAIL_BRAND.accent};text-transform:uppercase;letter-spacing:0.5px;">
          Etkinlik hatırlatması · ${whenLabel}
        </p>
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;">${params.eventTitle}</h1>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">
          Merhaba ${params.customerName || 'Değerli Müşterimiz'}, etkinliğiniz yaklaşıyor. Biletinizi yanınızda bulundurmayı unutmayın.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td style="padding:20px;">
              <p style="margin:0 0 12px;font-size:14px;color:rgba(255,255,255,0.75);">
                📅 ${params.eventDate}
              </p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);">
                📍 ${params.eventVenue}${params.eventCity ? `, ${params.eventCity}` : ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 28px;" align="center">
        <a href="${params.ticketsUrl}"
           style="display:inline-block;padding:14px 28px;background:${EMAIL_BRAND.accent};color:${EMAIL_BRAND.bg};font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;">
          Biletimi Görüntüle
        </a>
        ${calendarBlock}
        <p style="margin:16px 0 0;font-size:13px;">
          <a href="${params.eventUrl}" style="color:rgba(255,255,255,0.5);text-decoration:underline;">Etkinlik detayları</a>
        </p>
      </td>
    </tr>
    ${emailFooter({
      note: `Sorularınız için ${emailConfig.supportEmail}`
    })}`;

  return emailShell(content);
}
