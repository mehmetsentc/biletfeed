import type { AnalyticsReferrerChannel } from '@prisma/client';

const SEARCH_HOSTS = [
  'google.',
  'bing.',
  'yandex.',
  'duckduckgo.',
  'yahoo.',
  'ecosia.'
];

const SOCIAL_HOSTS = [
  'instagram.',
  'facebook.',
  'fb.',
  'twitter.',
  'x.com',
  't.co',
  'tiktok.',
  'linkedin.',
  'whatsapp.',
  'telegram.',
  't.me',
  'pinterest.',
  'youtube.',
  'youtu.be'
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function classifyReferrerChannel(input: {
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
}): AnalyticsReferrerChannel {
  const medium = (input.utmMedium ?? '').toLowerCase();
  const source = (input.utmSource ?? '').toLowerCase();

  if (
    medium.includes('cpc') ||
    medium.includes('ppc') ||
    medium.includes('paid') ||
    medium.includes('ads') ||
    source.includes('googleads') ||
    source.includes('meta_ads') ||
    source.includes('tiktok_ads')
  ) {
    return 'paid';
  }

  if (medium === 'email' || source.includes('newsletter') || source.includes('mailchimp')) {
    return 'email';
  }

  if (medium === 'app' || source === 'app' || source === 'ios' || source === 'android') {
    return 'app';
  }

  if (
    medium === 'social' ||
    SOCIAL_HOSTS.some((h) => source.includes(h.replace(/\.$/, '')))
  ) {
    return 'social';
  }

  const ref = (input.referrer ?? '').trim();
  if (!ref) return 'direct';

  const host = hostOf(ref);
  if (SEARCH_HOSTS.some((h) => host.includes(h))) return 'organic';
  if (SOCIAL_HOSTS.some((h) => host.includes(h) || host === h.replace(/\.$/, ''))) {
    return 'social';
  }

  // Same-site referrer → direct
  if (
    host.includes('biletfeed.com') ||
    host.includes('localhost') ||
    host.endsWith('.vercel.app')
  ) {
    return 'direct';
  }

  return 'referral';
}
