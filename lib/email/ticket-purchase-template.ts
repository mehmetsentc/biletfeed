import { platformContact } from '@/lib/config/contact';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailFooter,
  emailLogoBar,
  emailShell
} from '@/lib/email/email-shared';
import {
  emailTicketInfoGrid,
  emailTicketLegalFooter,
  emailTicketReferenceBlock
} from '@/lib/email/ticket-email-blocks';
import { barcodeToDataUrl } from '@/lib/tickets/design/barcode';

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
  eventEndDate?: string;
  eventVenue: string;
  eventCity: string;
  coverImage: string;
  organizerName: string;
  orderNumber: string;
  totalLabel: string;
  ticketLines: Array<{ name: string; quantity: number; unitPrice: string }>;
  ticketCodes: string[];
  ticketsUrl: string;
  eventUrl: string;
  printUrl?: string;
  calendarUrl?: string;
  rules?: string;
}

/** Profesyonel bilet satın alma onay e-postası — receipt-style dark tema */
export function buildTicketPurchaseEmail(params: TicketPurchaseEmailParams): string {
  const {
    customerName,
    eventTitle,
    eventDate,
    eventVenue,
    eventCity,
    coverImage,
    organizerName,
    orderNumber,
    totalLabel,
    ticketLines,
    ticketCodes,
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
  const barcodeUrl = primaryCode
    ? barcodeToDataUrl(primaryCode, { width: 220, height: 44, barColor: '#FF8A00' })
    : '';

  const codesBlock =
    ticketCodes.length > 0 && primaryCode
      ? emailTicketReferenceBlock({
          codeLabel: ticketCodes.length > 1 ? 'Bilet Kodları (İlki)' : 'Bilet Kodu',
          ticketCode: primaryCode,
          barcodeDataUrl: barcodeUrl,
          hint:
            ticketCodes.length > 1
              ? `Toplam ${ticketCodes.length} bilet. Tüm kodlar hesabınızda görüntülenebilir.`
              : 'Girişte QR kodunuzu veya bilet kodunuzu gösterin.'
        }) +
        (ticketCodes.length > 1
          ? ticketCodes
              .slice(1)
              .map(
                (code) =>
                  `<p style="margin:4px 0;text-align:center;font-family:monospace;font-size:16px;font-weight:700;letter-spacing:2px;color:${EMAIL_BRAND.accent};">${esc(code)}</p>`
              )
              .join('')
          : '')
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
               width="560" style="display:block;width:100%;height:auto;max-height:240px;object-fit:cover;" />
        </td>
      </tr>`
    : '';

  const infoGrid = emailTicketInfoGrid([
    { label: 'Tarih & Saat', value: eventDate },
    { label: 'Konum', value: `${eventVenue}${eventCity ? `, ${eventCity}` : ''}` },
    { label: 'Organizatör', value: organizerName },
    { label: 'Sipariş No', value: orderNumber },
    { label: 'Toplam', value: totalLabel }
  ]);

  const content = `
    ${emailLogoBar()}
    ${coverBlock}
    ${emailAccentBar()}
    <tr>
      <td style="padding:32px 28px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${EMAIL_BRAND.accent};">
          ✦ Bilet Onayı
        </p>

        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;line-height:1.3;">
          Tebrikler${customerName ? `, ${esc(customerName)}` : ''}!
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;">
          <strong style="color:#fff;">${esc(eventTitle)}</strong> etkinliği için biletiniz hazır.
          Etkinlik günü QR kodunuzu girişte göstermeniz yeterli.
        </p>

        ${infoGrid}

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:4px 16px;">
          <tr>
            <th align="left" style="padding:12px 0 8px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Biletler</th>
            <th align="right" style="padding:12px 0 8px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Tutar</th>
          </tr>
          ${ticketRows}
        </table>

        ${codesBlock}

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

        ${rules ? `
        <div style="margin:0 0 20px;padding:14px 16px;background:rgba(255,255,255,0.03);border-radius:8px;">
          <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Önemli Notlar</p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.5;">${esc(rules.slice(0, 400))}${rules.length > 400 ? '…' : ''}</p>
        </div>` : ''}

        ${emailTicketLegalFooter('ticket')}

        <p style="margin:16px 0 0;font-size:12px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.6;">
          Destek: <a href="mailto:${platformContact.email}" style="color:${EMAIL_BRAND.accent};text-decoration:none;">${platformContact.email}</a>
          · ${platformContact.supportHours}
        </p>
      </td>
    </tr>
    ${emailFooter({ organizerName })}`;

  return emailShell(content);
}
