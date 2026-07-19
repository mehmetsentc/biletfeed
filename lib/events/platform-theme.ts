import type { MockEvent } from '@/lib/data/mock-events';
import { getExternalPlatformLabel, isExternalListing } from '@/lib/events/ticket-url';

export type PlatformTheme = {
  label: string;
  accent: string;
  /** accent üzerinde okunabilir metin/ikon rengi (neon zeminde siyah, koyu zeminlerde beyaz) */
  accentForeground: string;
  accentSoft: string;
  ctaLabel: string;
};

const EXTERNAL_THEMES: Record<string, PlatformTheme> = {
  BILETIMO: {
    label: 'Biletimo',
    accent: '#f97316',
    accentForeground: '#ffffff',
    accentSoft: 'rgba(249, 115, 22, 0.12)',
    ctaLabel: "Biletimo'da Bilet Al"
  },
  BILETIX: {
    label: 'Biletix',
    accent: '#2563eb',
    accentForeground: '#ffffff',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
    ctaLabel: "Biletix'te Bilet Al"
  },
  BUBILET: {
    label: 'Bubilet',
    accent: '#7c3aed',
    accentForeground: '#ffffff',
    accentSoft: 'rgba(124, 58, 237, 0.12)',
    ctaLabel: "Bubilet'te Bilet Al"
  },
  BILETINO: {
    label: 'Biletino',
    accent: '#0d9488',
    accentForeground: '#ffffff',
    accentSoft: 'rgba(13, 148, 136, 0.12)',
    ctaLabel: "Biletino'da Bilet Al"
  },
  PASSO: {
    label: 'Passo',
    accent: '#dc2626',
    accentForeground: '#ffffff',
    accentSoft: 'rgba(220, 38, 38, 0.12)',
    ctaLabel: "Passo'da Bilet Al"
  },
  GECCE: {
    label: 'Gecce.com',
    accent: '#db2777',
    accentForeground: '#ffffff',
    accentSoft: 'rgba(219, 39, 119, 0.12)',
    ctaLabel: "Gecce.com'da Bilet Al"
  }
};

const INTERNAL_THEME: PlatformTheme = {
  label: 'Bilet Feed',
  accent: '#DFFF00',
  accentForeground: '#050505',
  accentSoft: 'rgba(223, 255, 0, 0.12)',
  ctaLabel: 'Bilet Al'
};

export function getEventPlatformTheme(event: MockEvent): PlatformTheme {
  if (!isExternalListing(event)) return INTERNAL_THEME;

  const key = event.externalPlatform?.toUpperCase() ?? '';
  const themed = EXTERNAL_THEMES[key];
  if (themed) return themed;

  const label = getExternalPlatformLabel(event.externalPlatform) ?? 'Resmi site';
  return {
    label,
    accent: '#DFFF00',
    accentForeground: '#050505',
    accentSoft: 'rgba(223, 255, 0, 0.12)',
    ctaLabel: `${label}'da Bilet Al`
  };
}
