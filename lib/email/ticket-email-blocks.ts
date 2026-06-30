import { EMAIL_BRAND } from '@/lib/email/email-shared';
import {
  ticketCompanyAddressLine,
  ticketCompanyContactLine,
  ticketCompanyLegalLine,
  ticketTermsEn,
  ticketTermsTr
} from '@/lib/tickets/design/terms';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Receipt-style bilgi hücresi — e-posta HTML */
export function emailTicketInfoCell(label: string, value: string): string {
  return `
    <td style="padding:4px;vertical-align:top;width:33%;">
      <div style="padding:10px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;">
        <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${EMAIL_BRAND.accent};">${esc(label)}</p>
        <p style="margin:0;font-size:13px;font-weight:600;color:#fff;line-height:1.35;">${esc(value)}</p>
      </div>
    </td>`;
}

/** 3 sütunlu bilgi grid'i */
export function emailTicketInfoGrid(cells: Array<{ label: string; value: string }>): string {
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 3) {
    const chunk = cells.slice(i, i + 3);
    while (chunk.length < 3) chunk.push({ label: '', value: '' });
    rows.push(`
      <tr>
        ${chunk
          .map((c) =>
            c.label
              ? emailTicketInfoCell(c.label, c.value)
              : '<td style="padding:4px;width:33%;"></td>'
          )
          .join('')}
      </tr>`);
  }
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:separate;border-spacing:0;">
      ${rows.join('')}
    </table>`;
}

/** Referans kodu + barkod görseli bloğu */
export function emailTicketReferenceBlock(params: {
  codeLabel: string;
  ticketCode: string;
  barcodeDataUrl: string;
  hint: string;
}): string {
  const { codeLabel, ticketCode, barcodeDataUrl, hint } = params;
  return `
    <div style="text-align:center;margin:0 0 28px;padding:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
      <p style="margin:0 0 8px;font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.2px;">${esc(codeLabel)}</p>
      <p style="margin:0 0 12px;font-family:monospace;font-size:22px;font-weight:700;letter-spacing:3px;color:${EMAIL_BRAND.accent};">${esc(ticketCode)}</p>
      <img src="${barcodeDataUrl}" alt="" width="220" height="44" style="display:block;margin:0 auto 14px;max-width:100%;" />
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.45);line-height:1.6;">${esc(hint)}</p>
    </div>`;
}

/** Yasal şartlar + şirket bilgisi footer bloğu */
export function emailTicketLegalFooter(kind: 'ticket' | 'invitation'): string {
  return `
    <div style="margin:24px 0 0;padding:16px 0 0;border-top:1px solid rgba(255,255,255,0.08);">
      <p style="margin:0 0 8px;font-size:10px;color:rgba(255,255,255,0.4);line-height:1.65;">${esc(ticketTermsTr(kind))}</p>
      <p style="margin:0 0 12px;font-size:9px;color:rgba(255,255,255,0.25);line-height:1.55;font-style:italic;">${esc(ticketTermsEn(kind))}</p>
      <p style="margin:0 0 2px;font-size:9px;color:rgba(255,255,255,0.25);">${esc(ticketCompanyLegalLine())}</p>
      <p style="margin:0 0 2px;font-size:9px;color:rgba(255,255,255,0.25);">${esc(ticketCompanyAddressLine())}</p>
      <p style="margin:0;font-size:9px;color:rgba(255,255,255,0.25);">${esc(ticketCompanyContactLine())}</p>
    </div>`;
}

/** Receipt-style satır (tek sütun) */
export function emailReceiptRow(label: string, value: string, isLast = false): string {
  return `
    <tr>
      <td style="padding:14px 20px;${isLast ? '' : 'border-bottom:1px solid rgba(255,255,255,0.06);'}">
        <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">${esc(label)}</p>
        <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">${value}</p>
      </td>
    </tr>`;
}
