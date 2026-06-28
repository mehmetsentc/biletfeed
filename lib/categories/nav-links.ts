import { sortCategoriesByDisplayOrder } from '@/lib/categories/sort';

export type CategoryNavItem = {
  slug: string;
  name: string;
};

/** Drawer / menü bağlantıları — DB veya mock kategori listesinden */
export function toCategoryNavLinks(categories: CategoryNavItem[]): Array<{
  label: string;
  href: string;
  slug: string;
}> {
  return sortCategoriesByDisplayOrder(categories).map((cat) => ({
    slug: cat.slug,
    label: cat.name,
    href: `/kategoriler/${cat.slug}`
  }));
}
