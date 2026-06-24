/** Kategori slug → kapak görseli (ana sayfa ve /kategoriler) */
export const CATEGORY_IMAGES: Record<string, string> = {
  muzik: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&q=80',
  tiyatro: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80',
  festival: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80',
  spor: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80',
  sanat: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=400&q=80',
  teknoloji: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80',
  online: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80',
  komedi: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=400&q=80',
  cocuk: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&q=80',
  yemek: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  'yemek-icecek': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  party: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80'
};

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80';

export function resolveCategoryImage(
  slug: string,
  dbImage?: string | null
): string {
  return CATEGORY_IMAGES[slug] ?? dbImage?.trim() ?? DEFAULT_IMAGE;
}
