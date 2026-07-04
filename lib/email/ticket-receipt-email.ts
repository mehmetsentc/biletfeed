import { brandTheme } from '@/lib/config/brand-theme';
import { ticketHeaderLogoSrc } from '@/lib/brand/embed-logo';
import { platformContact } from '@/lib/config/contact';
import { EMAIL_BRAND, emailEsc as esc } from '@/lib/email/email-shared';
import { admissionRulesTr, ticketKindLabels } from '@/lib/tickets/design/ticket-receipt-shared';
import {
  ticketCompanyAddressLine,
  ticketCompanyLegalLine
} from '@/lib/tickets/design/terms';

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

/** Sade, okunaklı bilet/davetiye kartı — e-posta gövdesi */
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
    personalMessage,
    status = 'VALID'
  } = params;

  const labels = ticketKindLabels(kind);
  const isValid = status === 'VALID';
  const logoSrc = ticketHeaderLogoSrc();
  const location = [venue, city].filter(Boolean).join(', ');
  const rules = admissionRulesTr(kind).slice(0, 3);

  const personalBlock = personalMessage
    ? `
      <div style="margin:0 0 16px;padding:12px 14px;background:${EMAIL_BRAND.accentSoft};border-radius:10px;border-left:3px solid ${EMAIL_BRAND.accent};">
        <p style="margin:0;font-size:13px;font-style:italic;color:${EMAIL_BRAND.textSecondary};line-height:1.55;">
          &ldquo;${esc(personalMessage)}&rdquo;
        </p>
      </div>`
    : '';

  const rulesBlock = rules
    .map(
      (line) =>
        `<li style="margin:0 0 6px;font-size:12px;color:${EMAIL_BRAND.textSecondary};line-height:1.45;">${esc(line)}</li>`
    )
    .join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin:0 0 24px;border:1px solid ${EMAIL_BRAND.border};border-radius:14px;overflow:hidden;background:${EMAIL_BRAND.cardBg};">
      <tr>
        <td style="padding:16px 20px;background:linear-gradient(135deg,${brandTheme.orange} 0%,${brandTheme.orangeHover} 100%);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <img src="${logoSrc}" alt="BiletFeed" width="120" height="32"
                     style="display:block;height:28px;width:auto;border:0;" />
              </td>
              <td align="right" style="vertical-align:middle;">
                <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,0.15);font-size:10px;font-weight:700;letter-spacing:1px;color:#111;">
                  ${esc(labels.tr)}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding:20px;">
          <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:${EMAIL_BRAND.text};line-height:1.25;">
            ${esc(eventTitle)}
          </h2>
          <p style="margin:0 0 16px;font-size:13px;color:${EMAIL_BRAND.textSecondary};">
            ${kind === 'invitation' ? `${esc(holderName)} için davetiye` : `Sayın ${esc(holderName)}`}
          </p>

          ${personalBlock}

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
            <tr>
              <td width="50%" style="padding:0 8px 12px 0;vertical-align:top;">
                <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${EMAIL_BRAND.textMuted};">Tarih</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:${EMAIL_BRAND.text};">${esc(eventDate)}</p>
              </td>
              <td width="50%" style="padding:0 0 12px 8px;vertical-align:top;">
                <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${EMAIL_BRAND.textMuted};">Saat</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:${EMAIL_BRAND.text};">${esc(eventTime)}</p>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:0 0 12px;vertical-align:top;">
                <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${EMAIL_BRAND.textMuted};">Mekan</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:${EMAIL_BRAND.text};">${esc(location)}</p>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
                <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${EMAIL_BRAND.textMuted};">Tür</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:${EMAIL_BRAND.text};">${esc(categoryLabel || ticketTypeName)}</p>
              </td>
              <td width="50%" style="padding:0 0 0 8px;vertical-align:top;">
                <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${EMAIL_BRAND.textMuted};">Kod</p>
                <p style="margin:0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:15px;font-weight:700;letter-spacing:1px;color:${EMAIL_BRAND.accentDark};">${esc(ticketCode)}</p>
              </td>
            </tr>
            ${
              orderNumber
                ? `<tr>
                    <td colspan="2" style="padding-top:12px;">
                      <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;color:${EMAIL_BRAND.textMuted};">Sipariş</p>
                      <p style="margin:0;font-size:13px;font-weight:600;color:${EMAIL_BRAND.text};">${esc(orderNumber)}</p>
                    </td>
                  </tr>`
                : ''
            }
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="120" style="vertical-align:middle;">
                <div style="padding:8px;border:1px solid ${EMAIL_BRAND.border};border-radius:10px;background:#fff;display:inline-block;">
                  <img src="${qrDataUrl}" alt="QR kod" width="104" height="104" style="display:block;" />
                </div>
              </td>
              <td style="padding-left:16px;vertical-align:middle;">
                <span style="display:inline-block;margin-bottom:8px;padding:4px 10px;border-radius:6px;font-size:10px;font-weight:700;background:${isValid ? '#ECFDF5' : '#FEF2F2'};color:${isValid ? EMAIL_BRAND.success : '#DC2626'};">
                  ${isValid ? 'Geçerli bilet' : 'Geçersiz'}
                </span>
                <p style="margin:0 0 8px;font-size:12px;color:${EMAIL_BRAND.textSecondary};line-height:1.5;">
                  Girişte bu QR kodu veya bilet kodunu gösterin.
                </p>
                <ul style="margin:0;padding-left:18px;">${rulesBlock}</ul>
              </td>
            </tr>
          </table>

          <p style="margin:16px 0 0;padding-top:14px;border-top:1px dashed ${EMAIL_BRAND.border};font-size:10px;color:${EMAIL_BRAND.textMuted};line-height:1.5;">
            ${esc(ticketCompanyLegalLine())} · ${esc(ticketCompanyAddressLine())} · ${esc(platformContact.email)}
          </p>
        </td>
      </tr>
    </table>`;
}
