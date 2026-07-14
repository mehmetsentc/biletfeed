import type { Metadata } from 'next';
import { siteConfig } from '@/lib/config/site';
import { getDefaultOgImage } from '@/lib/seo/constants';

interface PageMetadataOptions {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
}

interface EventMetadataOptions {
  title: string;
  slug: string;
  description?: string;
  image?: string;
  city?: string;
  venue?: string;
  startDate?: string;
  category?: string;
  isFree?: boolean;
  price?: number;
}

function buildAlternates(path: string): Metadata['alternates'] {
  const url = `${siteConfig.url}${path}`;
  return {
    canonical: url,
    languages: {
      'tr-TR': url,
      'x-default': url
    }
  };
}

function buildVerification(): Metadata['verification'] | undefined {
  const google = process.env.GOOGLE_SITE_VERIFICATION;
  if (!google) return undefined;
  return { google };
}

export function createPageMetadata({
  title,
  description = siteConfig.description,
  path = '',
  image,
  keywords,
  noIndex = false
}: PageMetadataOptions): Metadata {
  const url = `${siteConfig.url}${path}`;
  const ogImage = image || getDefaultOgImage();

  return {
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`
    },
    description,
    ...(keywords?.length ? { keywords } : {}),
    metadataBase: new URL(siteConfig.url),
    alternates: buildAlternates(path),
    verification: buildVerification(),
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage]
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true }
  };
}

export function createEventMetadata({
  title,
  slug,
  description,
  image,
  city,
  venue,
  startDate,
  category,
  isFree,
  price
}: EventMetadataOptions): Metadata {
  const path = `/etkinlik/${slug}`;

  const datePart = startDate
    ? new Date(startDate).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '';

  const locationPart =
    city && venue ? `${venue}, ${city}` : city || venue || '';

  const pricePart = isFree
    ? 'Ücretsiz giriş.'
    : price
      ? `${price} TL'den başlayan biletler.`
      : 'Biletler şimdi satışta.';

  const autoDescription = [
    title,
    datePart,
    locationPart,
    category ? `${category} etkinliği` : null,
    pricePart,
    'Bilet almak için Bilet Feed.'
  ]
    .filter(Boolean)
    .join(' · ');

  const keywords = [
    title,
    category,
    city,
    'etkinlik bilet',
    'konser bilet',
    'bilet al'
  ].filter((k): k is string => Boolean(k));

  return createPageMetadata({
    title,
    description: description || autoDescription,
    path,
    image,
    keywords
  });
}
