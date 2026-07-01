import {
  EMAIL_BRAND,
  emailAccentBar,
  emailFooter,
  emailLogoBar,
  emailShell,
  formatEventDateTimeTr
} from '@/lib/email/email-shared';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface EventApprovedEmailParams {
  organizerName: string;
  eventTitle: string;
  eventDate: Date;
  eventCity: string;
  eventVenue: string;
  coverImage: string;
  eventUrl: string;
  panelUrl: string;
}

export function buildEventApprovedEmail(params: EventApprovedEmailParams): string {
  const {
    organizerName,
    eventTitle,
    eventDate,
    eventCity,
    eventVenue,
    coverImage,
    eventUrl,
    panelUrl
  } = params;

  const dateLabel = formatEventDateTimeTr(eventDate);
  const locationLabel = eventVenue ? `${eventVenue}, ${eventCity}` : eventCity;

  const body = `
    ${emailLogoBar()}
    ${emailAccentBar()}
    <tr>
      <td style="padding:32px 28px 8px;font-family:system-ui,-apple-system,sans-serif;color:#f4f4f5;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.accent};">
          Etkinlik Onaylandı
        </p>
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:700;color:#ffffff;">
          Etkinliğiniz onaylanmıştır
        </h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a1a1aa;">
          Merhaba ${esc(organizerName)}, <strong style="color:#fafafa;">${esc(eventTitle)}</strong> etkinliğiniz BiletFeed ekibi tarafından incelendi ve yayına alındı. Artık herkese açık olarak listeleniyor ve bilet satışı başlayabilir.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;overflow:hidden;background:#18181b;border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td>
              <img src="${esc(coverImage)}" alt="${esc(eventTitle)}" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:20px 22px;font-family:system-ui,-apple-system,sans-serif;">
              <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#fafafa;">${esc(eventTitle)}</p>
              <p style="margin:0 0 6px;font-size:14px;color:#a1a1aa;">${esc(dateLabel)}</p>
              <p style="margin:0;font-size:14px;color:#a1a1aa;">${esc(locationLabel)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 32px;font-family:system-ui,-apple-system,sans-serif;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="border-radius:12px;background:${EMAIL_BRAND.accent};">
              <a href="${esc(eventUrl)}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:700;color:#111827;text-decoration:none;">
                Etkinliği Görüntüle
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
          Etkinlik linki: <a href="${esc(eventUrl)}" style="color:${EMAIL_BRAND.accent};text-decoration:none;">${esc(eventUrl)}</a>
        </p>
        <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
          Satışları ve istatistikleri organizatör panelinden takip edebilirsiniz:
          <a href="${esc(panelUrl)}" style="color:${EMAIL_BRAND.accent};text-decoration:none;">${esc(panelUrl)}</a>
        </p>
      </td>
    </tr>
    ${emailFooter()}`;

  return emailShell(body);
}
