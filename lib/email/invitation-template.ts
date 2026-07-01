import { buildGoogleCalendarUrl } from '@/lib/email/calendar';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailFooter,
  emailLogoBar,
  emailShell
} from '@/lib/email/email-shared';
import { buildTicketReceiptEmailCard } from '@/lib/email/ticket-receipt-email';

/** Elegant HTML email template for event invitations. */
export function buildInvitationEmail(params: {
  guestName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventCity: string;
  coverImage: string;
  ticketTypeName: string;
  ticketCode: string;
  qrDataUrl: string;
  personalMessage?: string;
  inviteUrl: string;
  calendarUrl?: string;
  organizerName?: string;
  categoryLabel?: string;
  sectorGate?: string;
}): string {
  const {
    guestName,
    eventTitle,
    eventDate,
    eventTime,
    eventVenue,
    eventCity,
    coverImage,
    ticketTypeName,
    ticketCode,
    qrDataUrl,
    personalMessage,
    inviteUrl,
    calendarUrl,
    organizerName,
    categoryLabel,
    sectorGate
  } = params;

  const coverBlock = coverImage
    ? `
      <tr>
        <td>
          <img src="${coverImage}" alt="${eventTitle}"
               width="560" style="display:block;width:100%;height:auto;max-height:200px;object-fit:cover;" />
        </td>
      </tr>`
    : '';

  const personalBlock = personalMessage
    ? `
      <div style="margin:0 0 20px;padding:14px 18px;background:rgba(255,138,0,0.08);border-left:3px solid ${EMAIL_BRAND.accent};border-radius:0 8px 8px 0;">
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

  const receiptCard = buildTicketReceiptEmailCard({
    kind: 'invitation',
    eventTitle,
    eventDate,
    eventTime,
    venue: eventVenue,
    city: eventCity,
    ticketTypeName,
    holderName: guestName,
    ticketCode,
    qrDataUrl,
    personalMessage,
    categoryLabel,
    sectorGate
  });

  const content = `
    ${emailLogoBar()}
    ${coverBlock}
    ${emailAccentBar()}
    <tr>
      <td style="padding:28px 24px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${EMAIL_BRAND.accent};">
          ✦ Davetiye
        </p>
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;line-height:1.3;">
          Sayın ${guestName},
        </h1>
        <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;">
          <strong style="color:#fff;">${eventTitle}</strong> etkinliğine davetlisiniz.
          Aşağıdaki dijital davetiyenizi girişte göstermeniz yeterli.
        </p>
        ${personalBlock}
        ${receiptCard}
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
