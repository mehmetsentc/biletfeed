import { designTokens } from '@/lib/config/design-tokens';

/** Hot Tickets deneme — BiletFeed marka paleti */
export const hotTicketsTheme = {
  accent: designTokens.color.primary,
  accentHover: designTokens.color.primaryHover,
  accentPressed: designTokens.color.primaryPressed,
  onAccent: designTokens.color.neon.on,
  glow: designTokens.color.neon.glow,
  pageBg: designTokens.color.neutral.white,
  ink: designTokens.color.dark.background,
  muted: designTokens.color.neutral.gray400,
  soft: designTokens.color.neutral.gray100,
  heroBg: designTokens.color.dark.background
} as const;
