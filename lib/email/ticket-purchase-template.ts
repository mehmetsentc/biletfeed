import { platformContact } from '@/lib/config/contact';

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

/** Profesyonel bilet satın alma onay e-postası — davetiye şablonu ile uyumlu dark tema */
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

  const codesBlock =
    ticketCodes.length > 0
      ? `
      <div style="text-align:center;margin:0 0 28px;">
        <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Bilet Kod${ticketCodes.length > 1 ? 'ları' : 'u'}</p>
        ${ticketCodes
          .map(
            (code) =>
              `<p style="margin:4px 0;font-family:monospace;font-size:18px;font-weight:700;letter-spacing:2px;color:#f5a623;">${esc(code)}</p>`
          )
          .join('')}
      </div>`
      : '';

  const secondaryButtons = [
    printUrl
      ? `<a href="${printUrl}" style="display:inline-block;margin:6px;padding:10px 20px;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);font-size:13px;text-decoration:none;border-radius:8px;">PDF / Yazdır</a>`
      : '',
    calendarUrl
      ? `<a href="${calendarUrl}" style="display:inline-block;margin:6px;padding:10px 20px;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);font-size:13px;text-decoration:none;border-radius:8px;">Takvime Ekle</a>`
      : '',
    `<a href="${eventUrl}" style="display:inline-block;margin:6px;padding:10px 20px;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);font-size:13px;text-decoration:none;border-radius:8px;">Etkinlik Detayı</a>`
  ]
    .filter(Boolean)
    .join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Biletiniz Hazır</title>
</head>
<body style="margin:0;padding:0;background:#0c1017;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0c1017;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#151b24;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

          <tr>
            <td style="padding:20px 28px;background:#0e1420;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.5px;">
                bilet<span style="color:#f5a623;">feed</span>
              </span>
            </td>
          </tr>

          ${coverImage ? `
          <tr>
            <td>
              <img src="${esc(coverImage)}" alt="${esc(eventTitle)}"
                   width="560" style="display:block;width:100%;height:auto;max-height:240px;object-fit:cover;" />
            </td>
          </tr>` : ''}

          <tr><td><div style="height:3px;background:linear-gradient(90deg,#f5a623,#e09510);"></div></td></tr>

          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#f5a623;">
                ✦ Bilet Onayı
              </p>

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;line-height:1.3;">
                Tebrikler${customerName ? `, ${esc(customerName)}` : ''}!
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;">
                <strong style="color:#fff;">${esc(eventTitle)}</strong> etkinliği için biletiniz hazır.
                Etkinlik günü QR kodunuzu girişte göstermeniz yeterli.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Tarih & Saat</p>
                    <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">📅 ${esc(eventDate)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Konum</p>
                    <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">📍 ${esc(eventVenue)}${eventCity ? `, ${esc(eventCity)}` : ''}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Organizatör</p>
                    <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">${esc(organizerName)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;">
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Sipariş No</p>
                    <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-family:monospace;">${esc(orderNumber)}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr>
                  <th align="left" style="padding:0 0 8px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Biletler</th>
                  <th align="right" style="padding:0 0 8px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Tutar</th>
                </tr>
                ${ticketRows}
                <tr>
                  <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#fff;">Toplam</td>
                  <td style="padding:14px 0 0;text-align:right;font-size:15px;font-weight:700;color:#f5a623;">${esc(totalLabel)}</td>
                </tr>
              </table>

              ${codesBlock}

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px;">
                <tr>
                  <td align="center">
                    <a href="${ticketsUrl}"
                       style="display:inline-block;padding:14px 36px;background:#f5a623;color:#000;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
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

              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.6;">
                Destek: <a href="mailto:${platformContact.email}" style="color:#f5a623;text-decoration:none;">${platformContact.email}</a>
                · ${platformContact.supportHours}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 28px;background:#0e1420;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);text-align:center;">
                biletfeed.com · Güvenli etkinlik ve bilet platformu
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
