import { designTokens } from '@/lib/config/design-tokens';

/** BiletFeed marka renkleri — logo referans (#DFFF00 neon lime, TEK aksan rengi) */
export const brandTheme = {
  orange: designTokens.color.primary,
  orangeLight: designTokens.color.primaryLight,
  orangeHover: designTokens.color.primaryHover,
  orangePressed: designTokens.color.primaryPressed,
  orangeSoft: designTokens.color.primarySoft,
  orangeSurface: designTokens.color.primarySurface,
  orangeBorder: designTokens.color.primaryBorder,
  orangeScale: designTokens.color.orange,
  black: designTokens.color.text.primary,
  white: designTokens.color.text.inverse,
  surfaceDark: designTokens.color.dark.background,
  surfaceElevated: designTokens.color.dark.surface,
  surfaceCard: designTokens.color.dark.card,
  hero: designTokens.color.light.background,
  gray: {
    50: designTokens.color.light.background,
    100: designTokens.color.light.muted,
    400: designTokens.color.text.disabled,
    500: designTokens.color.text.muted,
    600: designTokens.color.text.secondary,
    900: designTokens.color.text.primary
  }
} as const;

export const brandLogos = {
  forDarkSurface: '/brand/logo-light.png',
  forLightSurface: '/brand/logo-dark.png',
  favicon: '/brand/favicon.png'
} as const;

export const brandAssetsVersion = '19';

export function brandAssetUrl(path: string): string {
  return `${path}?v=${brandAssetsVersion}`;
}

export type BrandTheme = typeof brandTheme;
