/**
 * BiletFeed Design System — TypeScript token referansı
 * Tek kaynak CSS: app/theme.css
 * Logo turuncusu: premium, sıcak, hafif kırmızı alt ton (#EB672B)
 */
export const designTokens = {
  color: {
    orange: {
      50: '#FFF5EE',
      100: '#FFE7D6',
      200: '#FFD4B8',
      300: '#FFB888',
      400: '#F58A17',
      500: '#EB672B',
      600: '#D9581C',
      700: '#C44A18',
      800: '#A33D14',
      900: '#7A2E0F',
      950: '#451A08'
    },
    primary: '#EB672B',
    primaryLight: '#F58A17',
    primaryHover: '#D9581C',
    primaryPressed: '#C44A18',
    primarySoft: '#FFE7D6',
    primarySurface: '#FFF5EE',
    primaryBorder: '#FFD4B8',
    text: {
      primary: '#1A1A1A',
      secondary: '#525252',
      muted: '#737373',
      disabled: '#A3A3A3',
      inverse: '#FFFFFF',
      link: '#EB672B',
      linkHover: '#D9581C'
    },
    light: {
      background: '#FAFAFA',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      sidebar: '#FFFFFF',
      navbar: '#FFFFFF',
      divider: '#ECECEC',
      input: '#FFFFFF',
      secondary: '#F7F7F7',
      muted: '#F5F5F5'
    },
    dark: {
      background: '#111111',
      surface: '#181818',
      card: '#1D1D1D',
      sidebar: '#171717',
      navbar: '#181818',
      border: '#2A2A2A',
      input: '#202020'
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
    sm: 8,
    button: 12,
    input: 12,
    badge: 8,
    card: 16,
    cardLg: 20,
    dialog: 20,
    image: 16,
    full: 9999
  },
  shadow: {
    card: '0 2px 12px rgba(26, 26, 26, 0.06)',
    cardHover: '0 12px 32px rgba(26, 26, 26, 0.1)',
    focus: '0 0 0 3px color-mix(in srgb, #EB672B 32%, transparent)'
  },
  spacing: [4, 8, 12, 16, 20, 24, 32, 48, 64] as const,
  motion: {
    fast: 180,
    normal: 220,
    slow: 280,
    ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  },
  category: {
    muzik: 'var(--category-muzik)',
    konser: 'var(--category-konser)',
    party: 'var(--category-party)',
    festival: 'var(--category-festival)',
    tiyatro: 'var(--category-tiyatro)',
    spor: 'var(--category-spor)',
    sanat: 'var(--category-sanat)',
    komedi: 'var(--category-komedi)',
    cocuk: 'var(--category-cocuk)',
    teknoloji: 'var(--category-teknoloji)',
    online: 'var(--category-online)',
    yemek: 'var(--category-yemek)',
    workshop: 'var(--category-workshop)',
    diger: 'var(--category-diger)'
  },
  typography: {
    fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
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
