import { platformContact } from '@/lib/config/contact';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailEsc as esc,
  emailFooter,
  emailLogoBar,
  emailPrimaryButton,
  emailSecondaryButton,
  emailSecondaryLink,
  emailShell
} from '@/lib/email/email-shared';

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
  pdfDownloadUrl?: string;
  calendarUrl?: string;
  rules?: string;
  hasPdfAttachment?: boolean;
}

/** Gmail 102KB kırpma limiti için hafif bilet özeti — gömülü logo / kurallar yok */
function buildCompactPurchaseTicketBlock(params: {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventCity: string;
  ticketTypeName: string;
  holderName: string;
  ticketCode: string;
  qrDataUrl: string;
}): string {
  const location = [params.eventVenue, params.eventCity].filter(Boolean).join(', ');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin:0 0 20px;border:1px solid ${EMAIL_BRAND.border};border-radius:12px;background:${EMAIL_BRAND.cardBg};">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${EMAIL_BRAND.textMuted};">
            Bilet özeti
          </p>
          <h2 style="margin:0 0 12px;font-size:18px;font-weight:800;color:${EMAIL_BRAND.text};line-height:1.3;">
            ${esc(params.eventTitle)}
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
            <tr>
              <td style="padding:0 0 8px;font-size:13px;color:${EMAIL_BRAND.textSecondary};line-height:1.5;">
                <strong style="color:${EMAIL_BRAND.text};">Tarih:</strong> ${esc(params.eventDate)} · ${esc(params.eventTime)}
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 8px;font-size:13px;color:${EMAIL_BRAND.textSecondary};line-height:1.5;">
                <strong style="color:${EMAIL_BRAND.text};">Mekan:</strong> ${esc(location)}
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 8px;font-size:13px;color:${EMAIL_BRAND.textSecondary};line-height:1.5;word-break:break-word;">
                <strong style="color:${EMAIL_BRAND.text};">Tür:</strong> ${esc(params.ticketTypeName)}
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;color:${EMAIL_BRAND.textSecondary};">
                <strong style="color:${EMAIL_BRAND.text};">Katılımcı:</strong> ${esc(params.holderName)}
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="108" style="vertical-align:top;">
                <img src="${params.qrDataUrl}" alt="QR kod" width="96" height="96"
                     style="display:block;border:1px solid ${EMAIL_BRAND.border};border-radius:8px;" />
              </td>
              <td style="padding-left:14px;vertical-align:middle;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;color:${EMAIL_BRAND.textMuted};">
                  Bilet kodu
                </p>
                <p style="margin:0 0 8px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:16px;font-weight:800;letter-spacing:1px;color:${EMAIL_BRAND.accentDark};word-break:break-all;">
                  ${esc(params.ticketCode)}
                </p>
                <p style="margin:0;font-size:12px;color:${EMAIL_BRAND.textSecondary};line-height:1.5;">
                  Girişte QR kodu veya bilet kodunu gösterin.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
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
    pdfDownloadUrl,
    calendarUrl,
    rules,
    hasPdfAttachment
  } = params;

  const preheader = `${eventTitle} — ${eventDate} ${eventTime}. Biletiniz ve QR kodunuz hazır.`;

  const ticketRows = ticketLines
    .map(
      (line) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BRAND.border};font-size:14px;color:${EMAIL_BRAND.text};word-break:break-word;line-height:1.45;">
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
    ? buildCompactPurchaseTicketBlock({
        eventTitle,
        eventDate,
        eventTime,
        eventVenue,
        eventCity,
        ticketTypeName: primaryType,
        holderName: customerName || 'Misafir',
        ticketCode: primaryCode,
        qrDataUrl
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

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:12px;">
          <tr>
            <td align="center">${emailPrimaryButton(ticketsUrl, 'Biletlerimi Görüntüle')}</td>
          </tr>
          ${
            pdfDownloadUrl
              ? `<tr>
                  <td align="center" style="padding-top:12px;">
                    ${emailSecondaryButton(pdfDownloadUrl, 'PDF Bilet İndir')}
                  </td>
                </tr>`
              : ''
          }
        </table>

        ${
          hasPdfAttachment
            ? `<p style="margin:0 0 16px;font-size:13px;color:${EMAIL_BRAND.textSecondary};text-align:center;line-height:1.55;">
                 PDF biletiniz bu e-postanın ekinde gönderilmiştir.
               </p>`
            : ''
        }

        <p style="margin:0 0 16px;text-align:center;line-height:2;">
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
  pdfDownloadUrl?: string;
  hasPdfAttachment?: boolean;
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
    params.hasPdfAttachment ? 'PDF biletiniz e-posta ekinde gönderilmiştir.' : '',
    params.pdfDownloadUrl ? `PDF indir: ${params.pdfDownloadUrl}` : '',
    '',
    `Biletleriniz: ${params.ticketsUrl}`,
    '',
    '— BiletFeed · biletfeed.com',
    'Bu e-posta satın alma onayınız için otomatik gönderilmiştir.'
  ]
    .filter(Boolean)
    .join('\n');
}
