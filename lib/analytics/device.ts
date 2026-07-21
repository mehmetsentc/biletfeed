import type { AnalyticsDeviceType } from '@prisma/client';

export function detectDeviceType(input: {
  userAgent?: string | null;
  width?: number | null;
}): AnalyticsDeviceType {
  const ua = (input.userAgent ?? '').toLowerCase();
  if (ua) {
    if (/ipad|tablet|kindle|silk|(android(?!.*mobile))/i.test(ua)) return 'tablet';
    if (/mobi|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return 'mobile';
    if (/bot|crawl|spider|slurp/i.test(ua)) return 'unknown';
    return 'desktop';
  }

  const w = input.width;
  if (typeof w === 'number' && Number.isFinite(w)) {
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  }

  return 'unknown';
}
