/** Kategori görüntüleme sırası — Konser, Party, Festival önce; Workshop ve Diğer en sonda */
export const CATEGORY_DISPLAY_ORDER = [
  'muzik',
  'party',
  'festival',
  'tiyatro',
  'komedi',
  'spor',
  'sanat',
  'cocuk',
  'teknoloji',
  'online',
  'yemek',
  'yemek-icecek',
  'workshop'
] as const;

const ORDER_INDEX = new Map<string, number>(
  CATEGORY_DISPLAY_ORDER.map((slug, index) => [slug, index])
);

function categorySortIndex(slug: string): number {
  if (slug === 'diger') return 10_000;
  return ORDER_INDEX.get(slug) ?? 9_000;
}

export function sortCategoriesByDisplayOrder<T extends { slug: string }>(
  categories: T[]
): T[] {
  return [...categories].sort(
    (a, b) => categorySortIndex(a.slug) - categorySortIndex(b.slug)
  );
}
