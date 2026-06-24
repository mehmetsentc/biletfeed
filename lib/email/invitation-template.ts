import { buildGoogleCalendarUrl } from '@/lib/email/calendar';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailFooter,
  emailLogoBar,
  emailShell
} from '@/lib/email/email-shared';

/** Elegant HTML email template for event invitations. */
export function buildInvitationEmail(params: {
  guestName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  eventCity: string;
  coverImage: string;
  ticketTypeName: string;
  ticketCode: string;
  personalMessage?: string;
  inviteUrl: string;
  calendarUrl?: string;
  organizerName?: string;
}): string {
  const {
    guestName,
    eventTitle,
    eventDate,
    eventVenue,
    eventCity,
    coverImage,
    ticketTypeName,
    ticketCode,
    personalMessage,
    inviteUrl,
    calendarUrl,
    organizerName
  } = params;

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
      <div style="margin:0 0 24px;padding:16px 20px;background:rgba(245,166,35,0.08);border-left:3px solid ${EMAIL_BRAND.accent};border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);font-style:italic;line-height:1.6;">
          "${personalMessage}"
        </p>
      </div>`
    : '';

  const calendarBlock = calendarUrl
    ? `
      <tr>
        <td align="center" style="padding-top:12px;">
          <a href="${calendarUrl}"
             style="font-size:13px;color:rgba(255,255,255,0.55);text-decoration:underline;">
            Takvime Ekle
          </a>
        </td>
      </tr>`
    : '';

  const content = `
    ${emailLogoBar()}
    ${coverBlock}
    ${emailAccentBar()}
    <tr>
      <td style="padding:32px 28px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${EMAIL_BRAND.accent};">
          ✦ Davetiye
        </p>
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;line-height:1.3;">
          Sayın ${guestName},
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
              <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">📅 ${eventDate}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Konum</p>
              <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">📍 ${eventVenue}, ${eventCity}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 20px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Bilet Türü</p>
              <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">🎟 ${ticketTypeName}</p>
            </td>
          </tr>
        </table>
        <div style="text-align:center;margin-bottom:28px;">
          <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Davetiye Kodu</p>
          <p style="margin:0;font-family:monospace;font-size:20px;font-weight:700;letter-spacing:3px;color:${EMAIL_BRAND.accent};">${ticketCode}</p>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center">
              <a href="${inviteUrl}"
                 style="display:inline-block;padding:14px 36px;background:${EMAIL_BRAND.accent};color:#000;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                Davetiyeni Görüntüle &amp; QR Kodu Al
              </a>
            </td>
          </tr>
          ${calendarBlock}
        </table>
      </td>
    </tr>
    ${emailFooter({
      organizerName,
      note: 'Bu e-posta otomatik gönderilmiştir. Sorularınız için organizatör veya destek ekibimizle iletişime geçebilirsiniz.'
    })}`;

  return emailShell(content);
}

export function buildInvitationCalendarUrl(params: {
  title: string;
  startDate: Date;
  endDate: Date;
  venue: string;
  city: string;
  address?: string;
  inviteUrl: string;
}): string {
  return buildGoogleCalendarUrl({
    title: params.title,
    startDate: params.startDate,
    endDate: params.endDate,
    location: [params.venue, params.address, params.city].filter(Boolean).join(', '),
    details: `Davetiye bağlantınız: ${params.inviteUrl}`
  });
}
