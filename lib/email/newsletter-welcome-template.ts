import { getSiteUrl } from '@/lib/config/domain';
import {
  EMAIL_BRAND,
  emailAccentBar,
  emailFooter,
  emailLogoBar,
  emailPrimaryButton,
  emailShell
} from '@/lib/email/email-shared';
import {
  newsletterBrandHighlights,
  newsletterEventsSection
} from '@/lib/email/newsletter-email-blocks';
import type { NewsletterDigestEvent } from '@/lib/email/newsletter-digest-template';

export function buildNewsletterWelcomeEmail(params: {
  cityName?: string | null;
  citySlug?: string | null;
  nationalEvents?: NewsletterDigestEvent[];
  cityEvents?: NewsletterDigestEvent[];
}): string {
  const cityName = params.cityName?.trim();
  const citySlug = params.citySlug?.trim();
  const nationalEvents = params.nationalEvents ?? [];
  const cityEvents = params.cityEvents ?? [];
  const eventsUrl = getSiteUrl('/etkinlikler');
  const cityEventsUrl = citySlug
    ? getSiteUrl(`/${citySlug}-etkinlikleri`)
    : eventsUrl;

  const preheader = cityName
    ? `${cityName} ve Türkiye genelinde yaklaşan etkinlikler — BiletFeed bültenine hoş geldiniz.`
    : 'Yaklaşan konser, festival ve etkinlikler — BiletFeed bültenine hoş geldiniz.';

  const cityLine = cityName
    ? `<strong style="color:${EMAIL_BRAND.text};">${cityName}</strong> ve Türkiye genelindeki yeni etkinlikleri size haftalık olarak ileteceğiz.`
    : 'Türkiye genelindeki yeni etkinliklerden haberdar olacaksınız. Site üzerinden şehrinizi seçerseniz size özel listeler de gönderilir.';

  const body = `
    <tr>
      <td style="padding:32px 28px 12px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:${EMAIL_BRAND.accent};">
          BiletFeed Bülteni
        </p>
        <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;color:${EMAIL_BRAND.text};line-height:1.25;">
          Bültenimize hoş geldiniz!
        </h1>
        <p style="margin:0 0 12px;font-size:16px;color:${EMAIL_BRAND.textSecondary};line-height:1.65;">
          Türkiye'nin etkinlik keşif platformu <strong style="color:${EMAIL_BRAND.text};">BiletFeed</strong>'e abone oldunuz.
          ${cityLine}
        </p>
        <p style="margin:0;font-size:14px;color:${EMAIL_BRAND.textMuted};line-height:1.6;">
          Haftalık özetler, yeni etkinlik duyuruları ve öne çıkan fırsatlar bu adrese gönderilecektir.
        </p>
      </td>
    </tr>
    ${newsletterBrandHighlights()}
    ${newsletterEventsSection({
      title: 'Yaklaşan etkinlikler',
      subtitle: 'Şu an öne çıkan etkinliklerden bir seçki — biletler tükenmeden inceleyin.',
      events: nationalEvents.slice(0, 5),
      ctaUrl: eventsUrl,
      ctaLabel: 'Tüm Etkinlikleri Gör'
    })}
    ${
      citySlug && cityEvents.length > 0
        ? newsletterEventsSection({
            title: cityName ? `${cityName}'de yaklaşan` : 'Şehrinizde yaklaşan',
            subtitle: cityName
              ? `${cityName} ve çevresindeki öne çıkan etkinlikler.`
              : 'Konumunuza göre yaklaşan etkinlikler.',
            events: cityEvents.slice(0, 4),
            ctaUrl: cityEventsUrl,
            ctaLabel: cityName ? `${cityName} Etkinlikleri` : 'Şehir Etkinlikleri'
          })
        : ''
    }
    ${
      nationalEvents.length === 0 && cityEvents.length === 0
        ? `<tr>
             <td style="padding:8px 28px 24px;text-align:center;">
               <p style="margin:0 0 20px;font-size:14px;color:${EMAIL_BRAND.textMuted};line-height:1.6;">
                 Yakında yeni etkinlikler eklendikçe size haber vereceğiz.
               </p>
               ${emailPrimaryButton(eventsUrl, 'Etkinlikleri Keşfet')}
             </td>
           </tr>`
        : ''
    }`;

  return emailShell(
    `${emailLogoBar()}${emailAccentBar()}${body}${emailFooter({
      note: 'Bu e-postayı BiletFeed bültenine abone olduğunuz için aldınız.'
    })}`,
    preheader
  );
}
