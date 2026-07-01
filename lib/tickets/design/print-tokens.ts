import { brandTheme } from '@/lib/config/brand-theme';

/** Baskı / PDF — açık zemin, profesyonel bilet stubu (iTicket referans) */
export const ticketPrintTokens = {
  pageBg: '#FFFFFF',
  headerBg: brandTheme.orange,
  headerText: '#1A1A1A',
  accent: brandTheme.orange,
  accentSoft: brandTheme.orangeSoft,
  accentBorder: brandTheme.orangeBorder,
  text: '#111111',
  textSecondary: '#444444',
  textMuted: '#666666',
  textDim: '#999999',
  border: '#D9D9D9',
  dash: '#BBBBBB',
  surface: '#F7F7F7',
  success: '#059669',
  danger: '#DC2626',
  watermark: '#E8E8E8'
} as const;
