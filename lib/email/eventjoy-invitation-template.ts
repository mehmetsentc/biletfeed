import { buildGoogleCalendarUrl } from '@/lib/email/calendar';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailEsc as esc,
  emailFooter,
  emailInfoGrid,
  emailLogoBar,
  emailPrimaryButton,
  emailQuoteBlock,
  emailSectionLabel,
  emailShell
} from '@/lib/email/email-shared';

export function buildEventJoyInvitationEmail(params: {
  guestName?: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  coverImage?: string;
  personalMessage?: string;
  inviteUrl: string;
  hostName: string;
}): string {
  const {
    guestName,
    eventTitle,
    eventDate,
    eventTime,
    location,
    coverImage,
    personalMessage,
    inviteUrl,
    hostName
  } = params;

  const greeting = guestName ? `Sayın ${guestName}` : 'Merhaba';
  const preheader = `${eventTitle} — ${eventDate}, ${eventTime}. EventJoy davetiyeniz hazır.`;

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

  const personalBlock = personalMessage ? emailQuoteBlock(personalMessage) : '';

  const content = `
    ${emailLogoBar()}
    ${coverBlock}
    ${emailAccentBar()}
    <tr>
      <td style="padding:28px 28px 8px;">
        ${emailSectionLabel('EventJoy Davetiye')}
        <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:${EMAIL_BRAND.text};line-height:1.25;">
          ${esc(greeting)}
        </h1>
        <p style="margin:0 0 20px;font-size:15px;color:${EMAIL_BRAND.textSecondary};line-height:1.65;">
          <strong style="color:${EMAIL_BRAND.text};">${esc(eventTitle)}</strong> etkinliğine davetlisiniz.
          Sizi aramızda görmekten büyük mutluluk duyacağız.
        </p>
        ${personalBlock}
        ${emailInfoGrid([
          { label: 'Etkinlik', value: eventTitle, icon: '🎫' },
          { label: 'Tarih & Saat', value: `${eventDate} · ${eventTime}`, icon: '📅' },
          { label: 'Konum', value: location || 'Belirtilecek', icon: '📍' }
        ])}
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 28px;" align="center">
        ${emailPrimaryButton(inviteUrl, 'Davetiyeyi Görüntüle')}
      </td>
    </tr>
    ${emailFooter({
      organizerName: hostName,
      note: 'Bu e-posta EventJoy üzerinden gönderilmiştir.'
    })}`;

  return emailShell(content, preheader);
}

export function buildEventJoyCalendarUrl(params: {
  title: string;
  date: string;
  time: string;
  location: string;
  inviteUrl: string;
}): string {
  const start = new Date(`${params.date}T${params.time || '00:00'}`);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return buildGoogleCalendarUrl({
    title: params.title,
    startDate: start,
    endDate: end,
    location: params.location,
    details: `Davetiye bağlantınız: ${params.inviteUrl}`
  });
}
