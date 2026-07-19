import { getSiteUrl } from '@/lib/config/domain';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailFooter,
  emailLogoBar,
  emailShell
} from '@/lib/email/email-shared';
import { newsletterEventsSection } from '@/lib/email/newsletter-email-blocks';

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

  const preheader = cityName
    ? `Bu hafta BiletFeed'te yeni — ${cityName} dahil`
    : "Bu hafta BiletFeed'te yeni etkinlikler";

  const body = `
    <tr>
      <td style="padding:32px 28px 8px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:${EMAIL_BRAND.accentDark};">
          Haftalık Bülten
        </p>
        <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:${EMAIL_BRAND.text};line-height:1.3;">
          Bu hafta BiletFeed'te neler var?
        </h1>
        <p style="margin:0;font-size:15px;color:${EMAIL_BRAND.textSecondary};line-height:1.65;">
          ${intro}
        </p>
      </td>
    </tr>
    ${newsletterEventsSection({
      title: "BiletFeed'te yeni",
      subtitle: 'Platforma yeni eklenen ve güncellenen etkinlikler.',
      events: nationalEvents,
      ctaUrl: allEventsUrl,
      ctaLabel: 'Tüm yeni etkinlikler'
    })}
    ${
      citySlug && cityEvents.length > 0
        ? newsletterEventsSection({
            title: citySectionTitle,
            subtitle: citySectionSubtitle,
            events: cityEvents,
            ctaUrl: cityEventsUrl,
            ctaLabel: `${cityName ?? 'Şehriniz'} etkinlikleri`
          })
        : ''
    }
    ${
      nationalEvents.length === 0 && cityEvents.length === 0
        ? `<tr><td style="padding:8px 28px 28px;"><p style="margin:0;font-size:14px;color:${EMAIL_BRAND.textMuted};line-height:1.55;">Bu dönemde yeni etkinlik bulunamadı. Yakında tekrar bakın!</p></td></tr>`
        : ''
    }`;

  return emailShell(
    `${emailLogoBar()}${emailAccentBar()}${body}${emailFooter({
      note: 'Bu e-postayı BiletFeed bülten aboneliğiniz kapsamında aldınız.'
    })}`,
    preheader
  );
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
