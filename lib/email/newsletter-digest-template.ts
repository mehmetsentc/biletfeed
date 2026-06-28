import { getSiteUrl } from '@/lib/config/domain';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailFooter,
  emailLogoBar,
  emailShell,
  formatCurrencyTr
} from '@/lib/email/email-shared';

export interface NewsletterDigestEvent {
  title: string;
  slug: string;
  startDate: Date;
  cityName: string;
  categoryName: string;
  coverImage: string;
  basePrice: number;
  isFree: boolean;
}

function formatEventDate(date: Date): string {
  return date.toLocaleDateString('tr-TR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function eventRow(event: NewsletterDigestEvent): string {
  const url = getSiteUrl(`/etkinlik/${event.slug}`);
  const price = event.isFree
    ? 'Ücretsiz'
    : event.basePrice > 0
      ? formatCurrencyTr(event.basePrice)
      : 'Biletler satışta';

  const cover = event.coverImage
    ? `<img src="${event.coverImage}" alt="" width="72" height="72"
           style="display:block;width:72px;height:72px;object-fit:cover;border-radius:12px;" />`
    : `<div style="width:72px;height:72px;border-radius:12px;background:rgba(255,255,255,0.08);"></div>`;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:12px;">
      <tr>
        <td width="72" valign="top">${cover}</td>
        <td style="padding-left:14px;vertical-align:top;">
          <a href="${url}" style="font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;line-height:1.35;">
            ${event.title}
          </a>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.62);line-height:1.5;">
            ${formatEventDate(event.startDate)} · ${event.cityName} · ${event.categoryName}
          </p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:${EMAIL_BRAND.accent};">
            ${price}
          </p>
        </td>
      </tr>
    </table>`;
}

function section(title: string, subtitle: string, events: NewsletterDigestEvent[], ctaUrl: string, ctaLabel: string): string {
  if (events.length === 0) return '';

  return `
    <tr>
      <td style="padding:28px 28px 8px;">
        <h2 style="margin:0 0 6px;font-size:18px;font-weight:700;color:#ffffff;">
          ${title}
        </h2>
        <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.5;">
          ${subtitle}
        </p>
        ${events.map(eventRow).join('')}
        <a href="${ctaUrl}"
           style="display:inline-block;margin-top:8px;font-size:14px;font-weight:600;color:${EMAIL_BRAND.accent};text-decoration:none;">
          ${ctaLabel} →
        </a>
      </td>
    </tr>`;
}

export function buildNewsletterDigestEmail(params: {
  cityName?: string | null;
  citySlug?: string | null;
  nationalEvents: NewsletterDigestEvent[];
  cityEvents: NewsletterDigestEvent[];
}): string {
  const { cityName, citySlug, nationalEvents, cityEvents } = params;
  const allEventsUrl = getSiteUrl('/etkinlikler');
  const cityEventsUrl = citySlug
    ? getSiteUrl(`/${citySlug}-etkinlikleri`)
    : allEventsUrl;

  const intro = cityName
    ? `${cityName} ve Türkiye genelindeki yeni etkinlikleri sizin için derledik.`
    : 'Türkiye genelindeki yeni etkinlikleri sizin için derledik.';

  const citySectionTitle = cityName ? `${cityName}'de yeni` : 'Şehrinizde yeni';
  const citySectionSubtitle = cityName
    ? `${cityName} ve çevresinde yaklaşan yeni etkinlikler.`
    : 'Konumunuza göre yaklaşan yeni etkinlikler.';

  const body = `
    <tr>
      <td style="padding:32px 28px 8px;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
          Bu hafta BiletFeed'te neler var?
        </h1>
        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.78);line-height:1.65;">
          ${intro}
        </p>
      </td>
    </tr>
    ${section(
      "BiletFeed'te yeni",
      'Platforma yeni eklenen ve güncellenen etkinlikler.',
      nationalEvents,
      allEventsUrl,
      'Tüm yeni etkinlikler'
    )}
    ${citySlug && cityEvents.length > 0
      ? section(
          citySectionTitle,
          citySectionSubtitle,
          cityEvents,
          cityEventsUrl,
          `${cityName ?? 'Şehriniz'} etkinlikleri`
        )
      : ''}
    ${nationalEvents.length === 0 && cityEvents.length === 0
      ? `<tr><td style="padding:8px 28px 28px;"><p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);">Bu dönemde yeni etkinlik bulunamadı. Yakında tekrar bakın!</p></td></tr>`
      : ''}`;

  return emailShell(`${emailLogoBar()}${emailAccentBar()}${body}${emailFooter()}`);
}

export function buildNewsletterDigestSubject(params: {
  cityName?: string | null;
  hasNational: boolean;
  hasCity: boolean;
}): string {
  const { cityName, hasNational, hasCity } = params;
  if (hasNational && hasCity && cityName) {
    return `BiletFeed'te yeni · ${cityName}'de yeni etkinlikler`;
  }
  if (hasCity && cityName) {
    return `${cityName}'de yeni etkinlikler — BiletFeed`;
  }
  return "BiletFeed'te yeni etkinlikler";
}
