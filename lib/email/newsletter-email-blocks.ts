import { getSiteUrl } from '@/lib/config/domain';
import {
  EMAIL_BRAND,
  emailEsc as esc,
  emailPrimaryButton,
  formatCurrencyTr
} from '@/lib/email/email-shared';
import type { NewsletterDigestEvent } from '@/lib/email/newsletter-digest-template';

function absoluteCoverUrl(cover: string): string {
  if (!cover?.trim()) return getSiteUrl('/brand/favicon.png');
  if (cover.startsWith('http://') || cover.startsWith('https://')) return cover;
  return getSiteUrl(cover.startsWith('/') ? cover : `/${cover}`);
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

export function newsletterEventRow(event: NewsletterDigestEvent): string {
  const url = getSiteUrl(`/etkinlik/${event.slug}`);
  const price = event.isFree
    ? 'Ücretsiz'
    : event.basePrice > 0
      ? formatCurrencyTr(event.basePrice)
      : 'Biletler satışta';
  const cover = absoluteCoverUrl(event.coverImage);

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin-bottom:14px;border:1px solid ${EMAIL_BRAND.border};border-radius:14px;overflow:hidden;background:${EMAIL_BRAND.cardBg};">
      <tr>
        <td width="96" valign="top" style="padding:0;line-height:0;">
          <a href="${url}" style="text-decoration:none;">
            <img src="${esc(cover)}" alt="${esc(event.title)}"
                 width="96" height="96"
                 style="display:block;width:96px;height:96px;object-fit:cover;border:0;" />
          </a>
        </td>
        <td style="padding:14px 16px 14px 0;vertical-align:top;">
          <span style="display:inline-block;margin:0 0 6px;padding:3px 8px;border-radius:999px;background:${EMAIL_BRAND.accentSoft};color:${EMAIL_BRAND.accentDark};font-size:10px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;">
            ${esc(event.categoryName)}
          </span>
          <a href="${url}" style="display:block;font-size:15px;font-weight:700;color:${EMAIL_BRAND.text};text-decoration:none;line-height:1.35;">
            ${esc(event.title)}
          </a>
          <p style="margin:6px 0 0;font-size:13px;color:${EMAIL_BRAND.textSecondary};line-height:1.5;">
            ${formatEventDate(event.startDate)} · ${esc(event.cityName)}
          </p>
          <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:${EMAIL_BRAND.accent};">
            ${price}
          </p>
        </td>
      </tr>
    </table>`;
}

export function newsletterEventsSection(params: {
  title: string;
  subtitle: string;
  events: NewsletterDigestEvent[];
  ctaUrl: string;
  ctaLabel: string;
}): string {
  const { title, subtitle, events, ctaUrl, ctaLabel } = params;
  if (events.length === 0) return '';

  return `
    <tr>
      <td style="padding:8px 28px 24px;">
        <h2 style="margin:0 0 6px;font-size:18px;font-weight:800;color:${EMAIL_BRAND.text};line-height:1.3;">
          ${esc(title)}
        </h2>
        <p style="margin:0 0 18px;font-size:14px;color:${EMAIL_BRAND.textSecondary};line-height:1.55;">
          ${esc(subtitle)}
        </p>
        ${events.map(newsletterEventRow).join('')}
        <div style="margin-top:4px;text-align:center;">
          ${emailPrimaryButton(ctaUrl, ctaLabel)}
        </div>
      </td>
    </tr>`;
}

export function newsletterBrandHighlights(): string {
  return `
    <tr>
      <td style="padding:0 28px 8px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="border-radius:14px;background:${EMAIL_BRAND.accentSoft};border:1px solid ${EMAIL_BRAND.border};">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:${EMAIL_BRAND.accentDark};letter-spacing:0.3px;text-transform:uppercase;">
                BiletFeed ile neler yapabilirsiniz?
              </p>
              <p style="margin:0 0 8px;font-size:14px;color:${EMAIL_BRAND.text};line-height:1.55;">
                <strong>Keşfedin</strong> — konser, festival, tiyatro ve daha fazlası
              </p>
              <p style="margin:0 0 8px;font-size:14px;color:${EMAIL_BRAND.text};line-height:1.55;">
                <strong>Takip edin</strong> — şehrinizdeki yeni etkinlik bildirimleri
              </p>
              <p style="margin:0;font-size:14px;color:${EMAIL_BRAND.text};line-height:1.55;">
                <strong>Güvenle alın</strong> — anında e-bilet, QR ile hızlı giriş
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}
