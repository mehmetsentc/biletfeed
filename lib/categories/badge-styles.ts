/** Semantic category badge colors — brand-aligned, theme-aware */
export type CategoryBadgeStyle = {
  bg: string;
  text: string;
  ring?: string;
};

/** Solid overlay badges on event images (high contrast, white text) */
export type CategoryOverlayStyle = {
  bg: string;
  text: string;
  shadow?: string;
};

const STYLES: Record<string, CategoryBadgeStyle> = {
  muzik: {
    bg: 'bg-[color-mix(in_srgb,var(--category-muzik)_16%,transparent)]',
    text: 'text-[var(--category-muzik)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-muzik)_32%,transparent)]'
  },
  konser: {
    bg: 'bg-[color-mix(in_srgb,var(--category-konser)_16%,transparent)]',
    text: 'text-[var(--category-konser)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-konser)_32%,transparent)]'
  },
  festival: {
    bg: 'bg-[color-mix(in_srgb,var(--category-festival)_16%,transparent)]',
    text: 'text-[var(--category-festival)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-festival)_32%,transparent)]'
  },
  party: {
    bg: 'bg-[color-mix(in_srgb,var(--category-party)_16%,transparent)]',
    text: 'text-[var(--category-party)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-party)_32%,transparent)]'
  },
  teknoloji: {
    bg: 'bg-[color-mix(in_srgb,var(--category-teknoloji)_16%,transparent)]',
    text: 'text-[var(--category-teknoloji)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-teknoloji)_32%,transparent)]'
  },
  workshop: {
    bg: 'bg-[color-mix(in_srgb,var(--category-workshop)_16%,transparent)]',
    text: 'text-[var(--category-workshop)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-workshop)_32%,transparent)]'
  },
  spor: {
    bg: 'bg-[color-mix(in_srgb,var(--category-spor)_16%,transparent)]',
    text: 'text-[var(--category-spor)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-spor)_32%,transparent)]'
  },
  tiyatro: {
    bg: 'bg-[color-mix(in_srgb,var(--category-tiyatro)_16%,transparent)]',
    text: 'text-[var(--category-tiyatro)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-tiyatro)_32%,transparent)]'
  },
  cocuk: {
    bg: 'bg-[color-mix(in_srgb,var(--category-cocuk)_18%,transparent)]',
    text: 'text-[var(--category-cocuk)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-cocuk)_32%,transparent)]'
  },
  online: {
    bg: 'bg-[color-mix(in_srgb,var(--category-online)_16%,transparent)]',
    text: 'text-[var(--category-online)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-online)_32%,transparent)]'
  },
  yemek: {
    bg: 'bg-[color-mix(in_srgb,var(--category-yemek)_16%,transparent)]',
    text: 'text-[var(--category-yemek)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-yemek)_32%,transparent)]'
  },
  'yemek-icecek': {
    bg: 'bg-[color-mix(in_srgb,var(--category-yemek-icecek)_16%,transparent)]',
    text: 'text-[var(--category-yemek-icecek)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-yemek-icecek)_32%,transparent)]'
  },
  komedi: {
    bg: 'bg-[color-mix(in_srgb,var(--category-komedi)_14%,transparent)]',
    text: 'text-[var(--category-komedi)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-komedi)_28%,transparent)]'
  },
  sanat: {
    bg: 'bg-[color-mix(in_srgb,var(--category-sanat)_16%,transparent)]',
    text: 'text-[var(--category-sanat)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-sanat)_32%,transparent)]'
  },
  diger: {
    bg: 'bg-[color-mix(in_srgb,var(--category-diger)_14%,transparent)]',
    text: 'text-[var(--category-diger)]',
    ring: 'ring-[color-mix(in_srgb,var(--category-diger)_28%,transparent)]'
  }
};

const OVERLAY_STYLES: Record<string, CategoryOverlayStyle> = {
  muzik: {
    bg: 'bg-[var(--category-muzik)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  },
  konser: {
    bg: 'bg-[var(--category-konser)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  },
  festival: {
    bg: 'bg-[var(--category-festival)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  },
  party: {
    bg: 'bg-[var(--category-party)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  },
  teknoloji: {
    bg: 'bg-[var(--category-teknoloji)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  },
  workshop: {
    bg: 'bg-[var(--category-workshop)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  },
  spor: {
    bg: 'bg-[var(--category-spor)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  },
  tiyatro: {
    bg: 'bg-[var(--category-tiyatro)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  },
  cocuk: {
    bg: 'bg-[var(--category-cocuk)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  },
  online: {
    bg: 'bg-[var(--category-online)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  },
  yemek: {
    bg: 'bg-[var(--category-yemek)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  },
  'yemek-icecek': {
    bg: 'bg-[var(--category-yemek-icecek)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  },
  komedi: {
    bg: 'bg-[var(--category-komedi)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  },
  sanat: {
    bg: 'bg-[var(--category-sanat)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  },
  diger: {
    bg: 'bg-[var(--category-diger)]',
    text: 'text-white',
    shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
  }
};

const FALLBACK: CategoryBadgeStyle = {
  bg: 'bg-muted',
  text: 'text-muted-foreground',
  ring: 'ring-border'
};

const OVERLAY_FALLBACK: CategoryOverlayStyle = {
  bg: 'bg-[var(--bf-text)]',
  text: 'text-[var(--bf-text-inverse)]',
  shadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
};

function normalizeSlug(slug: string): string {
  return slug.toLowerCase().trim();
}

export function getCategoryBadgeStyle(slug: string): CategoryBadgeStyle {
  return STYLES[normalizeSlug(slug)] ?? FALLBACK;
}

export function getCategoryOverlayStyle(slug: string): CategoryOverlayStyle {
  return OVERLAY_STYLES[normalizeSlug(slug)] ?? OVERLAY_FALLBACK;
}
