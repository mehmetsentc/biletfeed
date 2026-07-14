import { siteConfig } from '@/lib/config/site';

export function getDefaultOgImage(): string {
  return `${siteConfig.url}/og-default.jpg`;
}
