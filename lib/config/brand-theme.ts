/** Bilet Feed marka renkleri — Pornhub tarzı siyah + turuncu palet */
export const brandTheme = {
  orange: '#FF9900',
  orangeHover: '#FF6F00',
  orangeSoft: '#FFF3E0',
  black: '#000000',
  white: '#FFFFFF',
  /** Hero, footer, koyu yüzeyler */
  surfaceDark: '#000000',
  surfaceElevated: '#1B1B1B',
  surfaceCard: '#1B1B1B',
  hero: '#000000',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    900: '#171717'
  }
} as const;

/**
 * Marka logo dosyaları (`public/brand/`)
 * Dosya adları tema adını ifade eder; görsel içerik zemin rengine göre optimize edilmiştir.
 */
export const brandLogos = {
  /** Dark theme / siyah header — beyaz "Bilet" metni */
  forDarkSurface: '/brand/logo-light.png',
  /** Light theme / açık zemin — koyu "Bilet" metni */
  forLightSurface: '/brand/logo-dark.png',
  /** Favicon — turuncu bilet ikonu (1000×1000) */
  favicon: '/brand/favicon.png'
} as const;

/** CDN/cache kırma — logo güncellendiğinde artırın */
export const brandAssetsVersion = '8';

export function brandAssetUrl(path: string): string {
  return `${path}?v=${brandAssetsVersion}`;
}

export type BrandTheme = typeof brandTheme;
