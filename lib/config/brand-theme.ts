/** BiletFeed marka renkleri — logo referans: Siyah · Beyaz · #FF8A00 */
export const brandTheme = {
  orange: '#FF8A00',
  orangeHover: '#F57C00',
  orangePressed: '#E56F00',
  orangeSoft: '#FFF4E8',
  orangeBorder: '#FFD199',
  black: '#0A0A0A',
  white: '#FFFFFF',
  surfaceDark: '#0A0A0A',
  surfaceElevated: '#151515',
  surfaceCard: '#151515',
  hero: '#FFFFFF',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    400: '#A3A3A3',
    500: '#777777',
    600: '#5A5A5A',
    900: '#111111'
  }
} as const;

export const brandLogos = {
  forDarkSurface: '/brand/logo-light.png',
  forLightSurface: '/brand/logo-dark.png',
  favicon: '/brand/favicon.png'
} as const;

export const brandAssetsVersion = '16';

export function brandAssetUrl(path: string): string {
  return `${path}?v=${brandAssetsVersion}`;
}

export type BrandTheme = typeof brandTheme;
