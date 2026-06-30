import { brandTheme } from '@/lib/config/brand-theme';

/** BiletFeed bilet / davetiye belge tasarım token'ları */
export const ticketDesignTokens = {
  pageBg: '#0c1017',
  cardBg: '#131920',
  cardBorder: 'rgba(255, 138, 0, 0.18)',
  surfaceMuted: 'rgba(255, 255, 255, 0.04)',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  orange: brandTheme.orange,
  orangeHover: brandTheme.orangeHover,
  orangeSoft: 'rgba(255, 138, 0, 0.12)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textMuted: 'rgba(255, 255, 255, 0.4)',
  textDim: 'rgba(255, 255, 255, 0.25)',
  success: '#34d399',
  successSoft: 'rgba(52, 211, 153, 0.12)',
  danger: '#ef4444',
  dangerSoft: 'rgba(239, 68, 68, 0.12)',
  qrBg: '#ffffff',
  divider: 'rgba(255, 138, 0, 0.22)',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  fontMono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  radius: {
    card: 16,
    box: 10,
    qr: 14
  }
} as const;

export type TicketDesignTokens = typeof ticketDesignTokens;
