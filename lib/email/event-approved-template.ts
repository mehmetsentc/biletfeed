import {
  EMAIL_BRAND,
  emailAccentBar,
  emailEsc as esc,
  emailFooter,
  emailInfoGrid,
  emailLogoBar,
  emailPrimaryButton,
  emailSecondaryLink,
  emailSectionLabel,
  emailShell,
  formatEventDateTimeTr
} from '@/lib/email/email-shared';

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
  const preheader = `${eventTitle} yayına alındı — BiletFeed'te listeleniyor.`;

  const body = `
    ${emailLogoBar()}
    ${emailAccentBar()}
    <tr>
      <td style="padding:28px 28px 8px;">
        ${emailSectionLabel('Etkinlik Onaylandı')}
        <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:${EMAIL_BRAND.text};line-height:1.25;">
          Etkinliğiniz onaylanmıştır
        </h1>
        <p style="margin:0 0 20px;font-size:15px;color:${EMAIL_BRAND.textSecondary};line-height:1.65;">
          Merhaba ${esc(organizerName)},
          <strong style="color:${EMAIL_BRAND.text};">${esc(eventTitle)}</strong> etkinliğiniz BiletFeed ekibi tarafından incelendi ve yayına alındı.
          Artık herkese açık olarak listeleniyor ve bilet satışı başlayabilir.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="border-radius:16px;overflow:hidden;background:${EMAIL_BRAND.cardBg};border:1px solid ${EMAIL_BRAND.border};">
          <tr>
            <td>
              <img src="${esc(coverImage)}" alt="${esc(eventTitle)}" width="544"
                   style="display:block;width:100%;max-width:544px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:${EMAIL_BRAND.text};">${esc(eventTitle)}</p>
              ${emailInfoGrid([
                { label: 'Tarih', value: dateLabel, icon: '📅' },
                { label: 'Konum', value: locationLabel, icon: '📍' }
              ])}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 32px;" align="center">
        ${emailPrimaryButton(eventUrl, 'Etkinliği Görüntüle')}
        <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${EMAIL_BRAND.textMuted};">
          Etkinlik linki: ${emailSecondaryLink(eventUrl, eventUrl)}
        </p>
        <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:${EMAIL_BRAND.textMuted};">
          Satışları ve istatistikleri organizatör panelinden takip edebilirsiniz:
          ${emailSecondaryLink(panelUrl, 'Organizatör Paneli')}
        </p>
      </td>
    </tr>
    ${emailFooter()}`;

  return emailShell(body, preheader);
}
