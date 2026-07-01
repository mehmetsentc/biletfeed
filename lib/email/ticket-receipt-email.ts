import { brandTheme } from '@/lib/config/brand-theme';
import { ticketHeaderLogoSrc } from '@/lib/brand/embed-logo';
import { platformContact } from '@/lib/config/contact';
import { barcodeToDataUrl } from '@/lib/tickets/design/barcode';
import {
  admissionRulesTr,
  bilingualFieldLabels,
  ticketKindLabels
} from '@/lib/tickets/design/ticket-receipt-shared';
import {
  ticketCompanyAddressLine,
  ticketCompanyContactLine,
  ticketCompanyLegalLine,
  ticketTermsEn,
  ticketTermsTr
} from '@/lib/tickets/design/terms';

const p = {
  pageBg: '#FFFFFF',
  headerBg: brandTheme.orange,
  headerText: '#1A1A1A',
  accent: brandTheme.orange,
  accentSoft: brandTheme.orangeSoft,
  text: '#111111',
  textSecondary: '#444444',
  textMuted: '#666666',
  textDim: '#999999',
  border: '#D9D9D9',
  dash: '#BBBBBB',
  watermark: '#E8E8E8'
} as const;

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function perforatedLine(): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:18px 0;">
      <tr>
        <td style="border-top:2px dashed ${p.dash};font-size:0;line-height:0;">&nbsp;</td>
      </tr>
    </table>`;
}

function detailCell(label: string, value: string): string {
  return `
    <td width="50%" style="padding:0 12px 14px 0;vertical-align:top;">
      <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${p.textMuted};">${esc(label)}</p>
      <p style="margin:0;font-size:12px;font-weight:600;color:${p.text};line-height:1.35;">${esc(value)}</p>
    </td>`;
}

function summaryRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 10px;border:1px solid ${p.border};font-size:9px;font-weight:700;color:${p.textMuted};text-transform:uppercase;background:${p.accentSoft};">${esc(label)}</td>
      <td style="padding:6px 10px;border:1px solid ${p.border};font-size:11px;font-weight:600;color:${p.text};">${esc(value)}</td>
    </tr>`;
}

export type TicketReceiptEmailParams = {
  kind: 'ticket' | 'invitation';
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  city: string;
  ticketTypeName: string;
  holderName: string;
  ticketCode: string;
  qrDataUrl: string;
  orderNumber?: string;
  categoryLabel?: string;
  sectorGate?: string;
  personalMessage?: string;
  status?: 'VALID' | 'INVALID';
};

/** iTicket tarzı beyaz bilet kartı — e-posta gövdesine gömülür */
export function buildTicketReceiptEmailCard(params: TicketReceiptEmailParams): string {
  const {
    kind,
    eventTitle,
    eventDate,
    eventTime,
    venue,
    city,
    ticketTypeName,
    holderName,
    ticketCode,
    qrDataUrl,
    orderNumber,
    categoryLabel,
    sectorGate,
    personalMessage,
    status = 'VALID'
  } = params;

  const labels = ticketKindLabels(kind);
  const isValid = status === 'VALID';
  const barcodeUrl = barcodeToDataUrl(ticketCode, { width: 200, height: 36, barColor: p.text });
  const verticalBarcodeUrl = barcodeToDataUrl(ticketCode, { width: 110, height: 32, barColor: p.text });
  const logoSrc = ticketHeaderLogoSrc();
  const rules = admissionRulesTr(kind);

  const personalBlock = personalMessage
    ? `
      <div style="margin:0 0 14px;padding:8px 12px;background:${p.accentSoft};border-radius:4px;">
        <p style="margin:0;font-size:10px;font-style:italic;color:${p.textSecondary};line-height:1.5;">&ldquo;${esc(personalMessage)}&rdquo;</p>
      </div>`
    : '';

  const summaryTable =
    orderNumber || categoryLabel || ticketCode
      ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 0;border-collapse:collapse;">
        ${summaryRow('Kod / Code', ticketCode)}
        ${categoryLabel ? summaryRow('Kategori / Category', categoryLabel) : summaryRow('Tür / Type', ticketTypeName)}
        ${orderNumber ? summaryRow('Sipariş / Order', orderNumber) : ''}
      </table>`
      : '';

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin:0 0 24px;border:1px solid ${p.border};border-radius:6px;overflow:hidden;background:${p.pageBg};">
      <!-- Header — BiletFeed marka -->
      <tr>
        <td style="background:${p.pageBg};padding:14px 18px 0;border-bottom:3px solid ${p.accent};">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;">
                <img src="${logoSrc}" alt="BiletFeed" width="150" height="38"
                     style="display:block;height:32px;width:auto;max-width:150px;border:0;" />
              </td>
              <td align="right" style="vertical-align:middle;">
                <p style="margin:0;font-size:9px;font-weight:700;letter-spacing:1.5px;color:${p.text};text-transform:uppercase;">${labels.tr}</p>
                <p style="margin:3px 0 0;font-size:8px;color:${p.textMuted};font-weight:600;">biletfeed.com</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding:16px 18px;">
          <!-- QR + rules + vertical barcode -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="108" style="vertical-align:top;">
                <div style="padding:6px;border:1px solid ${p.border};border-radius:4px;display:inline-block;">
                  <img src="${qrDataUrl}" alt="QR" width="96" height="96" style="display:block;" />
                </div>
              </td>
              <td style="padding:0 12px;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:9px;font-weight:700;color:${p.text};letter-spacing:0.5px;">GİRİŞ KURALLARI</p>
                ${rules
                  .map(
                    (line) =>
                      `<p style="margin:0 0 3px;font-size:9px;color:${p.textSecondary};line-height:1.4;">${esc(line)}</p>`
                  )
                  .join('')}
              </td>
              <td width="48" align="center" style="vertical-align:top;">
                <img src="${verticalBarcodeUrl}" alt="" width="32" height="110"
                     style="display:block;margin:0 auto 4px;transform:rotate(-90deg);" />
                <p style="margin:0;font-size:7px;color:${p.textMuted};word-break:break-all;">${esc(ticketCode)}</p>
              </td>
            </tr>
          </table>

          ${perforatedLine()}

          <!-- Main body -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="position:relative;padding-left:4px;">
                <p style="margin:0 0 4px;text-align:right;font-size:20px;font-weight:800;color:${p.watermark};letter-spacing:2px;text-transform:uppercase;">${labels.en}</p>
                <h1 style="margin:0 0 8px;font-size:20px;font-weight:800;color:${p.text};text-transform:uppercase;line-height:1.25;">${esc(eventTitle)}</h1>
                <p style="margin:0 0 12px;font-size:11px;color:${p.textSecondary};">
                  ${kind === 'invitation' ? `<strong style="color:${p.text};">${esc(holderName)}</strong> adına düzenlenmiştir` : `Sayın <strong style="color:${p.text};">${esc(holderName)}</strong>`}
                </p>
                ${personalBlock}
                <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${p.accent};text-transform:uppercase;">${labels.typeLabel}</p>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    ${detailCell(bilingualFieldLabels.venue, `${venue}, ${city}`)}
                    ${detailCell(bilingualFieldLabels.date, eventDate)}
                  </tr>
                  <tr>
                    ${detailCell(bilingualFieldLabels.time, eventTime)}
                    ${detailCell(kind === 'invitation' ? 'DAVETİYE TÜRÜ / TYPE' : bilingualFieldLabels.type, ticketTypeName)}
                  </tr>
                  <tr>
                    ${detailCell(bilingualFieldLabels.holder, holderName)}
                    ${detailCell(labels.codeLabelEn, ticketCode)}
                  </tr>
                  ${
                    categoryLabel || sectorGate
                      ? `<tr>
                          ${categoryLabel ? detailCell(bilingualFieldLabels.category, categoryLabel) : '<td></td>'}
                          ${sectorGate ? detailCell(bilingualFieldLabels.sector, sectorGate) : '<td></td>'}
                        </tr>`
                      : ''
                  }
                </table>

                ${summaryTable}

                <table width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 0;">
                  <tr>
                    <td width="80">
                      <span style="display:inline-block;padding:3px 10px;border-radius:3px;font-size:8px;font-weight:700;letter-spacing:0.5px;background:${isValid ? '#05966922' : '#DC262622'};color:${isValid ? '#059669' : '#DC2626'};">
                        ${isValid ? 'GEÇERLİ / VALID' : 'GEÇERSİZ / INVALID'}
                      </span>
                    </td>
                    <td align="right">
                      <img src="${barcodeUrl}" alt="" width="200" height="36" style="display:block;margin-left:auto;" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          ${perforatedLine()}

          <!-- Footer -->
          <p style="margin:0 0 6px;font-size:8px;font-weight:700;color:${p.textMuted};letter-spacing:0.5px;">ŞARTLAR / TERMS</p>
          <p style="margin:0 0 4px;font-size:8px;color:${p.textSecondary};line-height:1.55;">${esc(ticketTermsTr(kind))}</p>
          <p style="margin:0 0 10px;font-size:7px;color:${p.textMuted};line-height:1.5;font-style:italic;">${esc(ticketTermsEn(kind))}</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${p.border};padding-top:8px;">
            <tr>
              <td style="vertical-align:top;">
                <p style="margin:0 0 2px;font-size:7px;color:${p.textDim};">${esc(ticketCompanyLegalLine())}</p>
                <p style="margin:0 0 2px;font-size:7px;color:${p.textDim};">${esc(ticketCompanyAddressLine())}</p>
                <p style="margin:0;font-size:7px;color:${p.textDim};">${esc(ticketCompanyContactLine())}</p>
              </td>
              <td width="140" align="right" style="vertical-align:bottom;">
                <p style="margin:0 0 2px;font-size:8px;font-weight:700;color:${p.textMuted};">Yardım / Support</p>
                <p style="margin:0;font-size:8px;color:${p.accent};font-weight:600;">${esc(platformContact.email)}</p>
                <p style="margin:4px 0 0;font-size:8px;color:${p.accent};font-weight:700;">biletfeed.com</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}
