import { platformContact } from '@/lib/config/contact';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailEsc as esc,
  emailFooter,
  emailLogoBar,
  emailPrimaryButton,
  emailSecondaryLink,
  emailShell
} from '@/lib/email/email-shared';
import { buildTicketReceiptEmailCard } from '@/lib/email/ticket-receipt-email';

export interface TicketPurchaseEmailParams {
  customerName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventEndDate?: string;
  eventVenue: string;
  eventCity: string;
  coverImage: string;
  organizerName: string;
  orderNumber: string;
  totalLabel: string;
  ticketLines: Array<{ name: string; quantity: number; unitPrice: string }>;
  ticketCodes: string[];
  qrDataUrl: string;
  ticketsUrl: string;
  eventUrl: string;
  printUrl?: string;
  calendarUrl?: string;
  rules?: string;
}

export function buildTicketPurchaseEmail(params: TicketPurchaseEmailParams): string {
  const {
    customerName,
    eventTitle,
    eventDate,
    eventTime,
    eventVenue,
    eventCity,
    coverImage,
    organizerName,
    orderNumber,
    totalLabel,
    ticketLines,
    ticketCodes,
    qrDataUrl,
    ticketsUrl,
    eventUrl,
    printUrl,
    calendarUrl,
    rules
  } = params;

  const preheader = `${eventTitle} — ${eventDate} ${eventTime}. Biletiniz ve QR kodunuz hazır.`;

  const ticketRows = ticketLines
    .map(
      (line) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BRAND.border};font-size:14px;color:${EMAIL_BRAND.text};">
            ${esc(line.name)} <span style="color:${EMAIL_BRAND.textMuted};">×${line.quantity}</span>
          </td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid ${EMAIL_BRAND.border};font-size:14px;font-weight:600;color:${EMAIL_BRAND.text};">
            ${esc(line.unitPrice)}
          </td>
        </tr>`
    )
    .join('');

  const primaryCode = ticketCodes[0] ?? '';
  const primaryType = ticketLines[0]?.name ?? 'Bilet';

  const receiptCard = primaryCode
    ? buildTicketReceiptEmailCard({
        kind: 'ticket',
        eventTitle,
        eventDate,
        eventTime,
        venue: eventVenue,
        city: eventCity,
        ticketTypeName: primaryType,
        holderName: customerName || 'Misafir',
        ticketCode: primaryCode,
        qrDataUrl,
        orderNumber,
        categoryLabel: primaryType
      })
    : '';

  const extraCodes =
    ticketCodes.length > 1
      ? `
        <div style="margin:0 0 20px;padding:14px 16px;background:${EMAIL_BRAND.pageBg};border-radius:10px;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${EMAIL_BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;">
            Diğer bilet kodları
          </p>
          ${ticketCodes
            .slice(1)
            .map(
              (code) =>
                `<p style="margin:4px 0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:15px;font-weight:700;letter-spacing:1px;color:${EMAIL_BRAND.accentDark};">${esc(code)}</p>`
            )
            .join('')}
        </div>`
      : '';

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
          Bilet onayı
        </p>
        <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:${EMAIL_BRAND.text};line-height:1.25;">
          ${customerName ? `Teşekkürler, ${esc(customerName)}` : 'Biletiniz hazır'}
        </h1>
        <p style="margin:0 0 20px;font-size:15px;color:${EMAIL_BRAND.textSecondary};line-height:1.65;">
          <strong style="color:${EMAIL_BRAND.text};">${esc(eventTitle)}</strong> için ödemeniz alındı.
          Dijital biletiniz aşağıdadır — girişte QR kodu göstermeniz yeterli.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0"
               style="margin-bottom:20px;background:${EMAIL_BRAND.pageBg};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;">
          <tr>
            <td style="padding:14px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:11px;font-weight:700;text-transform:uppercase;color:${EMAIL_BRAND.textMuted};">Sipariş</td>
                  <td align="right" style="font-size:11px;font-weight:700;text-transform:uppercase;color:${EMAIL_BRAND.textMuted};">Toplam</td>
                </tr>
                <tr>
                  <td style="padding:6px 0 12px;font-size:14px;font-weight:700;color:${EMAIL_BRAND.text};">${esc(orderNumber)}</td>
                  <td align="right" style="padding:6px 0 12px;font-size:16px;font-weight:800;color:${EMAIL_BRAND.accentDark};">${esc(totalLabel)}</td>
                </tr>
                ${ticketRows}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 20px 28px;">
        ${receiptCard}
        ${extraCodes}

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px;">
          <tr>
            <td align="center">${emailPrimaryButton(ticketsUrl, 'Biletlerimi Görüntüle')}</td>
          </tr>
        </table>

        <p style="margin:0 0 16px;text-align:center;line-height:2;">
          ${printUrl ? `${emailSecondaryLink(printUrl, 'PDF indir')} · ` : ''}
          ${calendarUrl ? `${emailSecondaryLink(calendarUrl, 'Takvime ekle')} · ` : ''}
          ${emailSecondaryLink(eventUrl, 'Etkinlik detayı')}
        </p>

        ${
          rules
            ? `
        <div style="margin:0 0 16px;padding:14px 16px;background:${EMAIL_BRAND.pageBg};border-radius:10px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${EMAIL_BRAND.textMuted};text-transform:uppercase;">Önemli notlar</p>
          <p style="margin:0;font-size:13px;color:${EMAIL_BRAND.textSecondary};line-height:1.55;">${esc(rules.slice(0, 400))}${rules.length > 400 ? '…' : ''}</p>
        </div>`
            : ''
        }

        <p style="margin:0;font-size:12px;color:${EMAIL_BRAND.textMuted};text-align:center;line-height:1.6;">
          Sorularınız için: <a href="mailto:${platformContact.email}" style="color:${EMAIL_BRAND.accentDark};text-decoration:none;">${platformContact.email}</a>
        </p>
      </td>
    </tr>
    ${emailFooter({ organizerName })}`;

  return emailShell(content, preheader);
}

export function buildTicketPurchasePlainText(params: {
  customerName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventCity: string;
  orderNumber: string;
  totalLabel: string;
  ticketCodes: string[];
  ticketsUrl: string;
}): string {
  return [
    params.customerName ? `Merhaba ${params.customerName},` : 'Merhaba,',
    '',
    `${params.eventTitle} etkinliği için biletiniz hazır.`,
    '',
    `Tarih: ${params.eventDate}`,
    `Saat: ${params.eventTime}`,
    `Mekan: ${params.eventVenue}, ${params.eventCity}`,
    `Sipariş: ${params.orderNumber}`,
    `Toplam: ${params.totalLabel}`,
    `Bilet kodu: ${params.ticketCodes.join(', ')}`,
    '',
    `Biletleriniz: ${params.ticketsUrl}`,
    '',
    '— BiletFeed · biletfeed.com',
    'Bu e-posta satın alma onayınız için otomatik gönderilmiştir.'
  ].join('\n');
}
