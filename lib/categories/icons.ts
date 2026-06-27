import {
  Baby,
  Clapperboard,
  Cpu,
  Globe,
  Laugh,
  Music2,
  Palette,
  PartyPopper,
  Sparkles,
  Tent,
  Trophy,
  UtensilsCrossed,
  type LucideIcon
} from 'lucide-react';

export interface CategoryIconConfig {
  Icon: LucideIcon;
}

const DEFAULT: CategoryIconConfig = { Icon: Sparkles };

export const CATEGORY_ICON_MAP: Record<string, CategoryIconConfig> = {
  muzik: { Icon: Music2 },
  konser: { Icon: Music2 },
  party: { Icon: PartyPopper },
  festival: { Icon: Tent },
  tiyatro: { Icon: Clapperboard },
  komedi: { Icon: Laugh },
  standup: { Icon: Laugh },
  spor: { Icon: Trophy },
  sanat: { Icon: Palette },
  cocuk: { Icon: Baby },
  teknoloji: { Icon: Cpu },
  workshop: { Icon: Cpu },
  online: { Icon: Globe },
  yemek: { Icon: UtensilsCrossed },
  'yemek-icecek': { Icon: UtensilsCrossed },
  diger: { Icon: Sparkles }
};

/** Tüm bilinen kategori slug'ları (DB + scraper) */
export const KNOWN_CATEGORY_SLUGS = [
  'muzik',
  'tiyatro',
  'festival',
  'spor',
  'sanat',
  'teknoloji',
  'online',
  'komedi',
  'cocuk',
  'yemek'
] as const;

export function getCategoryIconConfig(slug: string): CategoryIconConfig {
  const key = slug.toLowerCase().trim();
  return CATEGORY_ICON_MAP[key] ?? DEFAULT;
}
