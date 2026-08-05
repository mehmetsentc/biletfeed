/**
 * Organizatör / admin görsel ölçüleri — brief ile tek kaynak.
 * UI ipuçları, Sharp banner render ve docs buradan beslenir.
 */

export type ImageSizeSpec = {
  key: string;
  label: string;
  width: number;
  height: number;
  /** Brief’teki adet (galeri vb.) */
  count?: number;
  category: 'web' | 'marketing';
  formatHint: string;
};

export const IMAGE_FORMAT_HINT = 'PNG, JPG veya WebP · yüksek çözünürlük';

/** Ana sayfa spotlight / hero banner (Sharp + admin upload) */
export const SPOTLIGHT_DIMENSIONS = {
  /** Mobil — 16:9 */
  mobile: { width: 800, height: 450 },
  /** Tablet — ~21:9 */
  tablet: { width: 1280, height: 548 },
  /** Masaüstü — brief Spotlight 2440×688 */
  desktop: { width: 2440, height: 688 }
} as const;

export const IMAGE_SPECS = {
  spotlightDesktop: {
    key: 'spotlightDesktop',
    label: 'Ana sayfa Spotlight (masaüstü)',
    width: SPOTLIGHT_DIMENSIONS.desktop.width,
    height: SPOTLIGHT_DIMENSIONS.desktop.height,
    category: 'web',
    formatHint: IMAGE_FORMAT_HINT
  },
  spotlightTablet: {
    key: 'spotlightTablet',
    label: 'Ana sayfa Spotlight (tablet)',
    width: SPOTLIGHT_DIMENSIONS.tablet.width,
    height: SPOTLIGHT_DIMENSIONS.tablet.height,
    category: 'web',
    formatHint: IMAGE_FORMAT_HINT
  },
  spotlightMobile: {
    key: 'spotlightMobile',
    label: 'Ana sayfa Spotlight (mobil)',
    width: SPOTLIGHT_DIMENSIONS.mobile.width,
    height: SPOTLIGHT_DIMENSIONS.mobile.height,
    category: 'web',
    formatHint: IMAGE_FORMAT_HINT
  },
  eventCover: {
    key: 'eventCover',
    label: 'Etkinlik detay kapak',
    width: 1920,
    height: 1080,
    category: 'web',
    formatHint: IMAGE_FORMAT_HINT
  },
  eventGallery: {
    key: 'eventGallery',
    label: 'Etkinlik galeri',
    width: 1920,
    height: 1080,
    count: 4,
    category: 'web',
    formatHint: IMAGE_FORMAT_HINT
  },
  groupHero: {
    key: 'groupHero',
    label: 'Grup sayfası hero',
    width: 1920,
    height: 1080,
    category: 'web',
    formatHint: IMAGE_FORMAT_HINT
  },
  groupStrip: {
    key: 'groupStrip',
    label: 'Grup sayfası şerit',
    width: 1220,
    height: 344,
    category: 'web',
    formatHint: IMAGE_FORMAT_HINT
  },
  artistHero: {
    key: 'artistHero',
    label: 'Sanatçı sayfası',
    width: 1920,
    height: 1080,
    category: 'web',
    formatHint: IMAGE_FORMAT_HINT
  },
  venueHero: {
    key: 'venueHero',
    label: 'Mekan sayfası',
    width: 1920,
    height: 1080,
    category: 'web',
    formatHint: IMAGE_FORMAT_HINT
  },
  venueGallery: {
    key: 'venueGallery',
    label: 'Mekan galeri',
    width: 1920,
    height: 1080,
    count: 4,
    category: 'web',
    formatHint: IMAGE_FORMAT_HINT
  },
  sponsorBand: {
    key: 'sponsorBand',
    label: 'Etkinlik sponsor bandı',
    width: 580,
    height: 60,
    category: 'web',
    formatHint: IMAGE_FORMAT_HINT
  },
  marketingPopup: {
    key: 'marketingPopup',
    label: 'Pop-up',
    width: 1080,
    height: 1080,
    category: 'marketing',
    formatHint: IMAGE_FORMAT_HINT
  },
  marketingIgPost: {
    key: 'marketingIgPost',
    label: 'Instagram Post',
    width: 1080,
    height: 1350,
    category: 'marketing',
    formatHint: IMAGE_FORMAT_HINT
  },
  marketingIgStory: {
    key: 'marketingIgStory',
    label: 'Instagram Story',
    width: 1080,
    height: 1920,
    category: 'marketing',
    formatHint: IMAGE_FORMAT_HINT
  },
  marketingMetaAd: {
    key: 'marketingMetaAd',
    label: 'Meta otomatik reklam',
    width: 1080,
    height: 1080,
    category: 'marketing',
    formatHint: IMAGE_FORMAT_HINT
  },
  marketingPush: {
    key: 'marketingPush',
    label: 'Push bildirimi',
    width: 360,
    height: 180,
    category: 'marketing',
    formatHint: IMAGE_FORMAT_HINT
  },
  marketingEmail: {
    key: 'marketingEmail',
    label: 'E-posta gönderimi',
    width: 520,
    height: 300,
    category: 'marketing',
    formatHint: IMAGE_FORMAT_HINT
  }
} as const satisfies Record<string, ImageSizeSpec>;

export type ImageSpecKey = keyof typeof IMAGE_SPECS;

export function formatImageSpecHint(spec: ImageSizeSpec): string {
  const size = `${spec.width}×${spec.height} px`;
  const count = spec.count && spec.count > 1 ? ` · ${spec.count} adet` : '';
  return `Önerilen: ${size}${count} · ${spec.formatHint}`;
}

/** Etkinlik.seo / mediaAssets JSON şeması */
export type EventMediaAssets = {
  sponsorBandUrl?: string;
  popup?: string;
  igPost?: string;
  igStory?: string;
  metaAd?: string;
  push?: string;
  email?: string;
};

export function parseEventMediaAssets(raw: unknown): EventMediaAssets {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, unknown>;
  const pick = (k: string) =>
    typeof o[k] === 'string' && (o[k] as string).trim()
      ? (o[k] as string).trim()
      : undefined;
  return {
    sponsorBandUrl: pick('sponsorBandUrl'),
    popup: pick('popup'),
    igPost: pick('igPost'),
    igStory: pick('igStory'),
    metaAd: pick('metaAd'),
    push: pick('push'),
    email: pick('email')
  };
}
