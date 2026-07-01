import { platformContact } from '@/lib/config/contact';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailFooter,
  emailLogoBar,
  emailShell
} from '@/lib/email/email-shared';
import { buildTicketReceiptEmailCard } from '@/lib/email/ticket-receipt-email';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

/** Profesyonel bilet satın alma onay e-postası — iTicket tarzı beyaz bilet kartı */
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

  const ticketRows = ticketLines
    .map(
      (line) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="font-size:14px;color:rgba(255,255,255,0.9);">${esc(line.name)}</span>
            <span style="float:right;font-size:14px;color:rgba(255,255,255,0.6);">×${line.quantity}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;font-size:14px;color:#fff;">${esc(line.unitPrice)}</td>
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
        <div style="margin:0 0 20px;padding:12px 16px;background:rgba(255,255,255,0.04);border-radius:8px;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Diğer Bilet Kodları</p>
          ${ticketCodes
            .slice(1)
            .map(
              (code) =>
                `<p style="margin:4px 0;font-family:monospace;font-size:16px;font-weight:700;letter-spacing:2px;color:${EMAIL_BRAND.accent};">${esc(code)}</p>`
            )
            .join('')}
        </div>`
      : '';

  const secondaryButtons = [
    printUrl
      ? `<a href="${printUrl}" style="display:inline-block;margin:6px;padding:10px 20px;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);font-size:13px;text-decoration:none;border-radius:8px;">Bilet İndir (PDF)</a>`
      : '',
    calendarUrl
      ? `<a href="${calendarUrl}" style="display:inline-block;margin:6px;padding:10px 20px;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);font-size:13px;text-decoration:none;border-radius:8px;">Takvime Ekle</a>`
      : '',
    `<a href="${eventUrl}" style="display:inline-block;margin:6px;padding:10px 20px;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);font-size:13px;text-decoration:none;border-radius:8px;">Etkinlik Detayı</a>`
  ]
    .filter(Boolean)
    .join('');

  const coverBlock = coverImage
    ? `
      <tr>
        <td>
          <img src="${esc(coverImage)}" alt="${esc(eventTitle)}"
               width="560" style="display:block;width:100%;height:auto;max-height:200px;object-fit:cover;" />
        </td>
      </tr>`
    : '';

  const content = `
    ${emailLogoBar()}
    ${coverBlock}
    ${emailAccentBar()}
    <tr>
      <td style="padding:28px 24px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${EMAIL_BRAND.accent};">
          ✦ Bilet Onayı
        </p>

        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;line-height:1.3;">
          Tebrikler${customerName ? `, ${esc(customerName)}` : ''}!
        </h1>
        <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;">
          <strong style="color:#fff;">${esc(eventTitle)}</strong> etkinliği için biletiniz hazır.
          Aşağıdaki dijital biletinizi girişte göstermeniz yeterli.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;">
          <tr>
            <td style="padding:12px 16px 4px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Sipariş</td>
                  <td align="right" style="font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Toplam</td>
                </tr>
                <tr>
                  <td style="padding:4px 0 12px;font-size:14px;font-weight:600;color:#fff;">${esc(orderNumber)}</td>
                  <td align="right" style="padding:4px 0 12px;font-size:14px;font-weight:700;color:${EMAIL_BRAND.accent};">${esc(totalLabel)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 16px 12px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <th align="left" style="padding:8px 0;font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Biletler</th>
                  <th align="right" style="padding:8px 0;font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Tutar</th>
                </tr>
                ${ticketRows}
              </table>
            </td>
          </tr>
        </table>

        ${receiptCard}
        ${extraCodes}

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px;">
          <tr>
            <td align="center">
              <a href="${ticketsUrl}"
                 style="display:inline-block;padding:14px 36px;background:${EMAIL_BRAND.accent};color:#000;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
                Biletlerimi Görüntüle &amp; QR Kod
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 20px;text-align:center;">${secondaryButtons}</p>

        ${
          rules
            ? `
        <div style="margin:0 0 20px;padding:14px 16px;background:rgba(255,255,255,0.03);border-radius:8px;">
          <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Önemli Notlar</p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.5;">${esc(rules.slice(0, 400))}${rules.length > 400 ? '…' : ''}</p>
        </div>`
            : ''
        }

        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.6;">
          Destek: <a href="mailto:${platformContact.email}" style="color:${EMAIL_BRAND.accent};text-decoration:none;">${platformContact.email}</a>
          · ${platformContact.supportHours}
        </p>
      </td>
    </tr>
    ${emailFooter({ organizerName })}`;

  return emailShell(content);
}
