import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';
import { siteConfig } from '@/lib/config/site';

export function getDefaultOgImage(): string {
  return `${siteConfig.url}${brandAssetUrl(brandLogos.forDarkSurface)}`;
}
