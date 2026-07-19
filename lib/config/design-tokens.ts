/**
 * BiletFeed Design System v2 — TypeScript token referansı
 * Tek kaynak CSS: app/theme.css
 * Marka vurgusu: Neon Lime #DFFF00 (logo). Siyah / Beyaz / Gri ile birlikte
 * TEK aksan rengi — büyük yüzeylerde veya uzun metinlerde kullanılmaz.
 */
export const designTokens = {
  color: {
    /** @deprecated `neon` kullanın — isim geriye dönük uyumluluk için korunuyor */
    orange: {
      50: '#FCFFEA',
      100: '#F8FFD9',
      200: '#EAF6A8',
      300: '#ECFF8C',
      400: '#E5FF66',
      500: '#DFFF00',
      600: '#C9E800',
      700: '#8FA800',
      800: '#5C6E00',
      900: '#3A4600',
      950: '#212700'
    },
    neon: {
      DEFAULT: '#DFFF00',
      hover: '#F0FF33',
      pressed: '#C9E800',
      lightSurface: '#F8FFD9',
      softBorder: '#EAF6A8',
      transparent: 'rgba(223,255,0,.08)',
      focusRing: 'rgba(223,255,0,.35)',
      glow: 'rgba(223,255,0,.25)',
      on: '#050505'
    },
    primary: '#DFFF00',
    primaryLight: '#E5FF66',
    primaryHover: '#F0FF33',
    primaryPressed: '#C9E800',
    primarySoft: '#F8FFD9',
    primarySurface: '#FCFFEA',
    primaryBorder: '#EAF6A8',
    neutral: {
      white: '#FFFFFF',
      offWhite: '#FAFAFA',
      gray50: '#F7F7F7',
      gray100: '#EFEFEF',
      gray200: '#E4E4E4',
      gray300: '#D2D2D2',
      gray400: '#A5A5A5',
      gray500: '#7A7A7A',
      gray600: '#555555',
      gray700: '#3A3A3A',
      gray800: '#242424',
      gray900: '#111111',
      black: '#050505'
    },
    text: {
      primary: '#050505',
      secondary: '#555555',
      muted: '#777777',
      disabled: '#B4B4B4',
      inverse: '#FFFFFF',
      link: '#050505',
      linkHover: '#C9E800'
    },
    light: {
      background: '#FFFFFF',
      surface: '#FAFAFA',
      card: '#FFFFFF',
      sidebar: '#FFFFFF',
      navbar: '#FFFFFF',
      divider: '#ECECEC',
      input: '#FFFFFF',
      secondary: '#FAFAFA',
      muted: '#F7F7F7'
    },
    dark: {
      background: '#050505',
      surface: '#0B0B0B',
      card: '#111111',
      cardElevated: '#181818',
      sidebar: '#050505',
      navbar: '#050505',
      border: '#232323',
      input: '#111111'
    },
    status: {
      success: '#16A34A',
      successSoft: '#DCFCE7',
      warning: '#D97706',
      warningSoft: '#FEF3C7',
      danger: '#DC2626',
      dangerSoft: '#FEE2E2',
      info: '#2563EB',
      infoSoft: '#DBEAFE'
    }
  },
  radius: {
    sm: 10,
    button: 18,
    input: 16,
    badge: 999,
    card: 24,
    cardLg: 28,
    dialog: 28,
    image: 24,
    full: 9999
  },
  shadow: {
    card: '0 1px 2px rgba(5, 5, 5, 0.03), 0 12px 32px rgba(5, 5, 5, 0.05)',
    cardHover: '0 20px 48px rgba(5, 5, 5, 0.09)',
    focus: '0 0 0 3px rgba(223,255,0,.35)'
  },
  spacing: [4, 8, 12, 16, 20, 24, 32, 48, 64] as const,
  motion: {
    fast: 180,
    normal: 220,
    slow: 250,
    ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  },
  category: {
    accent: 'var(--category-accent)'
  },
  typography: {
    fontFamily:
      'var(--font-geist-sans), var(--font-inter), ui-sans-serif, system-ui, sans-serif',
    display: { size: '2.75rem', weight: 800, lineHeight: 1.1 },
    heading: { size: '2rem', weight: 800, lineHeight: 1.2 },
    title: { size: '1.25rem', weight: 700, lineHeight: 1.3 },
    subtitle: { size: '1rem', weight: 600, lineHeight: 1.4 },
    body: { size: '1rem', weight: 400, lineHeight: 1.6 },
    caption: { size: '0.75rem', weight: 500, lineHeight: 1.5 },
    label: { size: '0.6875rem', weight: 600, lineHeight: 1.4, letterSpacing: '0.06em' }
  }
} as const;

export type DesignTokens = typeof designTokens;
