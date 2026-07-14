import {
  getSiteUrl,
  canonicalHost,
  getPanelUrl,
  getSupportUrl,
  getGirisUrl,
  getAdminUrl
} from '@/lib/config/domain';
import { brandTheme } from '@/lib/config/brand-theme';

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Bilet Feed',
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    'Etkinlik keşfet, bilet al, unutulmaz anılar biriktir',
  url: getSiteUrl(),
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000',
  canonicalHost,
  locale: 'tr-TR' as const,
  defaultCurrency: 'TRY' as const,
  brand: {
    orange: brandTheme.orange,
    black: brandTheme.black,
    white: brandTheme.white,
    gray: brandTheme.surfaceCard
  },
  features: {
    subdomains: process.env.NEXT_PUBLIC_ENABLE_SUBDOMAINS === 'true',
    aiAssistant: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
    eventJoy: process.env.NEXT_PUBLIC_ENABLE_EVENTJOY === 'true'
  },
  links: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL,
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL,
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL,
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL,
    organizerPanel: process.env.NEXT_PUBLIC_PANEL_URL || getPanelUrl(),
    supportCenter: process.env.NEXT_PUBLIC_SUPPORT_URL || getSupportUrl(),
    gateTerminal: process.env.NEXT_PUBLIC_GIRIS_URL || getGirisUrl(),
    adminPanel: process.env.NEXT_PUBLIC_ADMIN_URL || getAdminUrl()
  }
} as const;

export type SiteConfig = typeof siteConfig;
