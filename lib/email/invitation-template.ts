import { buildGoogleCalendarUrl } from '@/lib/email/calendar';
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
import { buildTicketReceiptEmailCard } from '@/lib/email/ticket-receipt-email';

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

  const preheader = `${eventTitle} — ${eventDate}, ${eventTime}. QR kodunuz e-postada.`;

  const coverBlock = coverImage
    ? `
      <tr>
        <td style="padding:0;">
          <img src="${esc(coverImage)}" alt="${esc(eventTitle)}"
               width="560" height="200"
               style="display:block;width:100%;max-height:200px;object-fit:cover;border:0;" />
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
      <td style="padding:28px 28px 8px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${EMAIL_BRAND.accentDark};">
          Davetiye
        </p>
        <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:${EMAIL_BRAND.text};line-height:1.25;">
          Merhaba ${esc(guestName)}
        </h1>
        <p style="margin:0 0 20px;font-size:15px;color:${EMAIL_BRAND.textSecondary};line-height:1.65;">
          <strong style="color:${EMAIL_BRAND.text};">${esc(eventTitle)}</strong> etkinliğine davet edildiniz.
          Aşağıdaki dijital davetiyenizi girişte göstermeniz yeterli.
        </p>

        ${emailInfoGrid([
          { label: 'Tarih', value: eventDate, icon: '📅' },
          { label: 'Saat', value: eventTime, icon: '🕐' },
          { label: 'Mekan', value: `${eventVenue}, ${eventCity}`, icon: '📍' }
        ])}
      </td>
    </tr>
    <tr>
      <td style="padding:0 20px 28px;">
        ${receiptCard}
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center" style="padding-bottom:12px;">
              ${emailPrimaryButton(inviteUrl, 'Davetiyemi Aç')}
            </td>
          </tr>
          ${
            calendarUrl
              ? `<tr>
                  <td align="center" style="padding-bottom:8px;">
                    ${emailSecondaryLink(calendarUrl, 'Takvime ekle')}
                  </td>
                </tr>`
              : ''
          }
        </table>
      </td>
    </tr>
    ${emailFooter({
      organizerName,
      note: 'Bu mesaj, etkinlik organizatörü tarafından BiletFeed üzerinden gönderilmiştir.'
    })}`;

  return emailShell(content, preheader);
}

export function buildInvitationPlainText(params: {
  guestName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventCity: string;
  ticketCode: string;
  inviteUrl: string;
}): string {
  return [
    `Merhaba ${params.guestName},`,
    '',
    `${params.eventTitle} etkinliğine davet edildiniz.`,
    '',
    `Tarih: ${params.eventDate}`,
    `Saat: ${params.eventTime}`,
    `Mekan: ${params.eventVenue}, ${params.eventCity}`,
    `Bilet kodu: ${params.ticketCode}`,
    '',
    `Davetiyeniz: ${params.inviteUrl}`,
    '',
    '— BiletFeed · biletfeed.com',
    'Bu e-posta etkinlik davetiyeniz için otomatik gönderilmiştir.'
  ].join('\n');
}

/** Toplu davetiye — tek e-postada ZIP eki; gövde hafif tutulur */
export function buildBulkInvitationZipEmail(params: {
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventCity: string;
  coverImage: string;
  organizerName?: string;
  ticketCount: number;
  tickets: Array<{ guestName: string; ticketCode: string }>;
}): string {
  const {
    recipientName,
    eventTitle,
    eventDate,
    eventTime,
    eventVenue,
    eventCity,
    coverImage,
    organizerName,
    ticketCount,
    tickets
  } = params;

  const preheader = `${eventTitle} — ${ticketCount} davetiye PDF ZIP ekinde.`;
  const location = [eventVenue, eventCity].filter(Boolean).join(', ');
  const visibleTickets = tickets.slice(0, 20);
  const hiddenCount = tickets.length - visibleTickets.length;

  const ticketRows = visibleTickets
    .map(
      (t) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid ${EMAIL_BRAND.border};font-size:13px;color:${EMAIL_BRAND.text};word-break:break-word;">
            ${esc(t.guestName)}
          </td>
          <td align="right" style="padding:8px 0;border-bottom:1px solid ${EMAIL_BRAND.border};font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;font-weight:700;color:${EMAIL_BRAND.accentDark};">
            ${esc(t.ticketCode)}
          </td>
        </tr>`
    )
    .join('');

  const coverBlock = coverImage
    ? `
      <tr>
        <td style="padding:0;">
          <img src="${esc(coverImage)}" alt="${esc(eventTitle)}"
               width="560" height="200"
               style="display:block;width:100%;max-height:200px;object-fit:cover;border:0;" />
        </td>
      </tr>`
    : '';

  const content = `
    ${emailLogoBar()}
    ${coverBlock}
    ${emailAccentBar()}
    <tr>
      <td style="padding:28px 28px 8px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${EMAIL_BRAND.accentDark};">
          Toplu davetiye
        </p>
        <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:${EMAIL_BRAND.text};line-height:1.25;">
          Merhaba ${esc(recipientName)}
        </h1>
        <p style="margin:0 0 20px;font-size:15px;color:${EMAIL_BRAND.textSecondary};line-height:1.65;">
          <strong style="color:${EMAIL_BRAND.text};">${esc(eventTitle)}</strong> için
          <strong style="color:${EMAIL_BRAND.text};">${ticketCount} adet</strong> QR kodlu davetiye PDF&apos;i
          ZIP dosyası olarak ektedir.
        </p>

        ${emailInfoGrid([
          { label: 'Tarih', value: eventDate, icon: '📅' },
          { label: 'Saat', value: eventTime, icon: '🕐' },
          { label: 'Mekan', value: location, icon: '📍' }
        ])}
      </td>
    </tr>
    <tr>
      <td style="padding:0 20px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="margin-bottom:16px;background:${EMAIL_BRAND.pageBg};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;">
          <tr>
            <td style="padding:14px 16px;">
              <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;color:${EMAIL_BRAND.textMuted};">
                Davetiye listesi
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${ticketRows}
              </table>
              ${
                hiddenCount > 0
                  ? `<p style="margin:10px 0 0;font-size:12px;color:${EMAIL_BRAND.textMuted};">… ve ${hiddenCount} davetiye daha (ZIP ekinde)</p>`
                  : ''
              }
            </td>
          </tr>
        </table>

        <p style="margin:0;font-size:13px;color:${EMAIL_BRAND.textSecondary};line-height:1.6;text-align:center;">
          Girişte her davetiyenin QR kodlu PDF&apos;ini veya bilet kodunu göstermeniz yeterli.
        </p>
      </td>
    </tr>
    ${emailFooter({
      organizerName,
      note: 'Bu mesaj, etkinlik organizatörü tarafından BiletFeed üzerinden gönderilmiştir.'
    })}`;

  return emailShell(content, preheader);
}

export function buildBulkInvitationZipPlainText(params: {
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventCity: string;
  ticketCount: number;
  tickets: Array<{ guestName: string; ticketCode: string }>;
}): string {
  const lines = [
    `Merhaba ${params.recipientName},`,
    '',
    `${params.eventTitle} etkinliği için ${params.ticketCount} adet davetiye PDF'i ZIP ekinde gönderilmiştir.`,
    '',
    `Tarih: ${params.eventDate}`,
    `Saat: ${params.eventTime}`,
    `Mekan: ${params.eventVenue}, ${params.eventCity}`,
    '',
    'Davetiyeler:'
  ];

  for (const t of params.tickets.slice(0, 30)) {
    lines.push(`- ${t.guestName}: ${t.ticketCode}`);
  }
  if (params.tickets.length > 30) {
    lines.push(`… ve ${params.tickets.length - 30} davetiye daha (ZIP ekinde)`);
  }

  lines.push('', '— BiletFeed · biletfeed.com');
  return lines.join('\n');
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
