/**
 * BiletFeed Design System — TypeScript token referansı
 * CSS kaynağı: app/theme.css
 */
export const designTokens = {
  color: {
    primary: '#FF8A00',
    primaryHover: '#F57C00',
    primaryPressed: '#E56F00',
    primarySoft: '#FFF4E8',
    primaryBorder: '#FFD199',
    dark: {
      bg: '#0A0A0A',
      surface: '#101010',
      card: '#151515',
      border: '#2B2B2B'
    },
    light: {
      bg: '#FFFFFF',
      surface: '#FAFAFA',
      card: '#FFFFFF',
      border: '#E9E9E9'
    },
    text: {
      primary: '#111111',
      secondary: '#5A5A5A',
      muted: '#777777',
      inverse: '#FFFFFF'
    },
    status: {
      success: '#16A34A',
      warning: '#F59E0B',
      danger: '#DC2626',
      info: '#2563EB'
    }
  },
  radius: {
    button: 14,
    input: 14,
    card: 20,
    dialog: 24,
    image: 18
  },
  spacing: [4, 8, 12, 16, 20, 24, 32, 48, 64] as const,
  motion: {
    hover: 150,
    fade: 250,
    page: 300
  },
  typography: {
    fontFamily: 'var(--font-sans), system-ui, sans-serif',
    weights: {
      normal: 400,
      semibold: 600,
      bold: 700
    }
  }
} as const;

export type DesignTokens = typeof designTokens;
