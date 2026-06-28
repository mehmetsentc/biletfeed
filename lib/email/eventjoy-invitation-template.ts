import { buildGoogleCalendarUrl } from '@/lib/email/calendar';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailFooter,
  emailLogoBar,
  emailShell
} from '@/lib/email/email-shared';

export function buildEventJoyInvitationEmail(params: {
  guestName?: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  coverImage?: string;
  personalMessage?: string;
  inviteUrl: string;
  hostName: string;
}): string {
  const {
    guestName,
    eventTitle,
    eventDate,
    eventTime,
    location,
    coverImage,
    personalMessage,
    inviteUrl,
    hostName
  } = params;

  const greeting = guestName
    ? `Sayın ${guestName},`
    : 'Merhaba,';

  const coverBlock = coverImage
    ? `
      <tr>
        <td>
          <img src="${coverImage}" alt="${eventTitle}"
               width="560" style="display:block;width:100%;height:auto;max-height:240px;object-fit:cover;" />
        </td>
      </tr>`
    : '';

  const personalBlock = personalMessage
    ? `
      <div style="margin:0 0 24px;padding:16px 20px;background:rgba(255,145,0,0.08);border-left:3px solid ${EMAIL_BRAND.accent};border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);font-style:italic;line-height:1.6;">
          "${personalMessage}"
        </p>
      </div>`
    : '';

  const content = `
    ${emailLogoBar()}
    ${coverBlock}
    ${emailAccentBar()}
    <tr>
      <td style="padding:32px 28px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${EMAIL_BRAND.accent};">
          ✦ EventJoy Davetiye
        </p>
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;line-height:1.3;">
          ${greeting}
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;">
          <strong style="color:#fff;">${eventTitle}</strong> etkinliğine davetlisiniz.
          Sizi aramızda görmekten büyük mutluluk duyacağız.
        </p>
        ${personalBlock}
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:28px;">
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Etkinlik</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#fff;">${eventTitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Tarih &amp; Saat</p>
              <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">📅 ${eventDate} · ${eventTime}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 20px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Konum</p>
              <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">📍 ${location || 'Belirtilecek'}</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center">
              <a href="${inviteUrl}"
                 style="display:inline-block;padding:14px 36px;background:${EMAIL_BRAND.accent};color:#000;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                Davetiyeyi Görüntüle
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${emailFooter({
      organizerName: hostName,
      note: 'Bu e-posta EventJoy üzerinden gönderilmiştir.'
    })}`;

  return emailShell(content);
}

export function buildEventJoyCalendarUrl(params: {
  title: string;
  date: string;
  time: string;
  location: string;
  inviteUrl: string;
}): string {
  const start = new Date(`${params.date}T${params.time || '00:00'}`);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return buildGoogleCalendarUrl({
    title: params.title,
    startDate: start,
    endDate: end,
    location: params.location,
    details: `Davetiye bağlantınız: ${params.inviteUrl}`
  });
}
