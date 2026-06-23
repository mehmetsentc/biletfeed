import {
  Baby,
  Clapperboard,
  Globe,
  Laptop,
  Laugh,
  Music2,
  Palette,
  Sparkles,
  Tent,
  Trophy,
  UtensilsCrossed,
  type LucideIcon
} from 'lucide-react';

export interface CategoryIconConfig {
  Icon: LucideIcon;
  gradient: string;
  iconClass: string;
}

const DEFAULT: CategoryIconConfig = {
  Icon: Sparkles,
  gradient: 'from-primary/30 to-primary/10',
  iconClass: 'text-primary'
};

export const CATEGORY_ICON_MAP: Record<string, CategoryIconConfig> = {
  muzik: {
    Icon: Music2,
    gradient: 'from-violet-500/30 via-violet-500/15 to-fuchsia-500/10',
    iconClass: 'text-violet-400'
  },
  konser: {
    Icon: Music2,
    gradient: 'from-violet-500/30 via-violet-500/15 to-fuchsia-500/10',
    iconClass: 'text-violet-400'
  },
  tiyatro: {
    Icon: Clapperboard,
    gradient: 'from-rose-500/30 via-rose-500/15 to-orange-500/10',
    iconClass: 'text-rose-400'
  },
  festival: {
    Icon: Tent,
    gradient: 'from-amber-500/30 via-amber-500/15 to-orange-500/10',
    iconClass: 'text-amber-400'
  },
  spor: {
    Icon: Trophy,
    gradient: 'from-emerald-500/30 via-emerald-500/15 to-teal-500/10',
    iconClass: 'text-emerald-400'
  },
  sanat: {
    Icon: Palette,
    gradient: 'from-fuchsia-500/30 via-fuchsia-500/15 to-pink-500/10',
    iconClass: 'text-fuchsia-400'
  },
  teknoloji: {
    Icon: Laptop,
    gradient: 'from-sky-500/30 via-sky-500/15 to-blue-500/10',
    iconClass: 'text-sky-400'
  },
  workshop: {
    Icon: Laptop,
    gradient: 'from-sky-500/30 via-sky-500/15 to-blue-500/10',
    iconClass: 'text-sky-400'
  },
  online: {
    Icon: Globe,
    gradient: 'from-indigo-500/30 via-indigo-500/15 to-violet-500/10',
    iconClass: 'text-indigo-400'
  },
  komedi: {
    Icon: Laugh,
    gradient: 'from-yellow-500/30 via-yellow-500/15 to-amber-500/10',
    iconClass: 'text-yellow-400'
  },
  standup: {
    Icon: Laugh,
    gradient: 'from-yellow-500/30 via-yellow-500/15 to-amber-500/10',
    iconClass: 'text-yellow-400'
  },
  cocuk: {
    Icon: Baby,
    gradient: 'from-pink-500/30 via-pink-500/15 to-rose-500/10',
    iconClass: 'text-pink-400'
  },
  yemek: {
    Icon: UtensilsCrossed,
    gradient: 'from-orange-500/30 via-orange-500/15 to-red-500/10',
    iconClass: 'text-orange-400'
  },
  'yemek-icecek': {
    Icon: UtensilsCrossed,
    gradient: 'from-orange-500/30 via-orange-500/15 to-red-500/10',
    iconClass: 'text-orange-400'
  }
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
