import fs from 'fs';
import path from 'path';
import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';
import { getSiteUrl } from '@/lib/config/domain';

const cache = new Map<string, string>();

/** E-posta / PDF / statik önizleme — logo her zaman görünsün diye base64 */
export function loadBrandLogoDataUrl(variant: 'dark' | 'light' = 'dark'): string {
  const key = `logo-${variant}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const file = variant === 'dark' ? 'logo-dark.png' : 'logo-light.png';
  const filePath = path.join(process.cwd(), 'public/brand', file);
  const buffer = fs.readFileSync(filePath);
  const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
  cache.set(key, dataUrl);
  return dataUrl;
}

/** Bilet kartı üst şeridi — turuncu zemin üzerinde koyu logo */
export function ticketHeaderLogoSrc(): string {
  return loadBrandLogoDataUrl('dark');
}

/** E-posta açık zemin — barındırılan HTTPS logo (data: URI birçok istemcide engellenir) */
export function emailHeaderLogoSrc(): string {
  if (process.env.TICKET_LOGO_EMBED === '1') {
    return loadBrandLogoDataUrl('dark');
  }
  return getSiteUrl(brandAssetUrl(brandLogos.forLightSurface));
}
