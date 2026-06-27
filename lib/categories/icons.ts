import {
  Baby,
  Clapperboard,
  Globe,
  Laptop,
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
  gradient: string;
  iconClass: string;
}

/** Marka turuncusu (#FF9900) tonları — kategoriler arası hafif fark, aynı palet */
function brandIcon(
  Icon: LucideIcon,
  variant: 'vivid' | 'warm' | 'soft' | 'deep' | 'muted'
): CategoryIconConfig {
  const styles: Record<
    typeof variant,
    Pick<CategoryIconConfig, 'gradient' | 'iconClass'>
  > = {
    vivid: {
      gradient: 'from-orange-500/40 via-orange-500/22 to-amber-400/12',
      iconClass: 'text-orange-400'
    },
    warm: {
      gradient: 'from-amber-500/35 via-orange-500/20 to-orange-600/10',
      iconClass: 'text-amber-400'
    },
    soft: {
      gradient: 'from-orange-400/32 via-orange-500/18 to-amber-500/10',
      iconClass: 'text-orange-300'
    },
    deep: {
      gradient: 'from-orange-600/38 via-orange-500/20 to-amber-600/12',
      iconClass: 'text-orange-500'
    },
    muted: {
      gradient: 'from-neutral-500/22 via-orange-500/14 to-neutral-600/10',
      iconClass: 'text-neutral-400'
    }
  };

  return { Icon, ...styles[variant] };
}

const DEFAULT: CategoryIconConfig = brandIcon(Sparkles, 'vivid');

export const CATEGORY_ICON_MAP: Record<string, CategoryIconConfig> = {
  muzik: brandIcon(Music2, 'vivid'),
  konser: brandIcon(Music2, 'vivid'),
  party: brandIcon(PartyPopper, 'warm'),
  festival: brandIcon(Tent, 'deep'),
  tiyatro: brandIcon(Clapperboard, 'soft'),
  komedi: brandIcon(Laugh, 'warm'),
  standup: brandIcon(Laugh, 'warm'),
  spor: brandIcon(Trophy, 'deep'),
  sanat: brandIcon(Palette, 'vivid'),
  cocuk: brandIcon(Baby, 'soft'),
  teknoloji: brandIcon(Laptop, 'muted'),
  workshop: brandIcon(Laptop, 'muted'),
  online: brandIcon(Globe, 'soft'),
  yemek: brandIcon(UtensilsCrossed, 'deep'),
  'yemek-icecek': brandIcon(UtensilsCrossed, 'deep'),
  diger: brandIcon(Sparkles, 'muted')
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
