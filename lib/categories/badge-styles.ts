/** Unified category badge — brand orange (#EB672B), theme-aware */
export type CategoryBadgeStyle = {
  bg: string;
  text: string;
  ring?: string;
};

/** Solid overlay badges on event images (high contrast on photos) */
export type CategoryOverlayStyle = {
  bg: string;
  text: string;
  shadow?: string;
  ring?: string;
};

const UNIFIED_BADGE: CategoryBadgeStyle = {
  bg: 'bg-primary/12',
  text: 'text-primary',
  ring: 'ring-primary/35'
};

const UNIFIED_OVERLAY: CategoryOverlayStyle = {
  bg: 'bg-primary',
  text: 'text-primary-foreground',
  shadow: 'shadow-[0_2px_12px_rgba(0,0,0,0.45)]',
  ring: 'ring-1 ring-white/30'
};

export function getCategoryBadgeStyle(_slug: string): CategoryBadgeStyle {
  return UNIFIED_BADGE;
}

export function getCategoryOverlayStyle(_slug: string): CategoryOverlayStyle {
  return UNIFIED_OVERLAY;
}
