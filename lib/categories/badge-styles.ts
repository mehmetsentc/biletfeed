/** Semantic category badge colors — brand-aligned, not generic purple */
export type CategoryBadgeStyle = {
  bg: string;
  text: string;
  ring?: string;
};

const STYLES: Record<string, CategoryBadgeStyle> = {
  muzik: {
    bg: 'bg-[color-mix(in_srgb,var(--bf-orange)_18%,transparent)]',
    text: 'text-[var(--bf-orange)]',
    ring: 'ring-[color-mix(in_srgb,var(--bf-orange)_35%,transparent)]'
  },
  konser: {
    bg: 'bg-[color-mix(in_srgb,var(--bf-orange)_18%,transparent)]',
    text: 'text-[var(--bf-orange)]',
    ring: 'ring-[color-mix(in_srgb,var(--bf-orange)_35%,transparent)]'
  },
  festival: {
    bg: 'bg-pink-500/15',
    text: 'text-pink-600 dark:text-pink-400',
    ring: 'ring-pink-500/25'
  },
  party: {
    bg: 'bg-pink-500/15',
    text: 'text-pink-600 dark:text-pink-400',
    ring: 'ring-pink-500/25'
  },
  teknoloji: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500/25'
  },
  workshop: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500/25'
  },
  spor: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500/25'
  },
  tiyatro: {
    bg: 'bg-violet-500/15',
    text: 'text-violet-600 dark:text-violet-400',
    ring: 'ring-violet-500/25'
  },
  cocuk: {
    bg: 'bg-amber-400/20',
    text: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-400/30'
  },
  online: {
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-600 dark:text-cyan-400',
    ring: 'ring-cyan-500/25'
  },
  yemek: {
    bg: 'bg-red-500/15',
    text: 'text-red-600 dark:text-red-400',
    ring: 'ring-red-500/25'
  },
  'yemek-icecek': {
    bg: 'bg-red-500/15',
    text: 'text-red-600 dark:text-red-400',
    ring: 'ring-red-500/25'
  },
  komedi: {
    bg: 'bg-[color-mix(in_srgb,var(--bf-orange)_12%,transparent)]',
    text: 'text-[var(--bf-orange-hover)]',
    ring: 'ring-[color-mix(in_srgb,var(--bf-orange)_25%,transparent)]'
  },
  sanat: {
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-600 dark:text-indigo-400',
    ring: 'ring-indigo-500/25'
  }
};

const FALLBACK: CategoryBadgeStyle = {
  bg: 'bg-muted',
  text: 'text-muted-foreground',
  ring: 'ring-border'
};

export function getCategoryBadgeStyle(slug: string): CategoryBadgeStyle {
  return STYLES[slug.toLowerCase().trim()] ?? FALLBACK;
}
