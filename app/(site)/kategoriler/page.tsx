import { PageHero } from '@/components/layout/page-hero';
import { CategoryCircleLink } from '@/components/categories/category-circle-link';
import { getCategories } from '@/lib/services/events';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Kategoriler',
  path: '/kategoriler'
});

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <>
      <PageHero
        title="Kategoriler"
        subtitle="İlgi alanınıza göre etkinlikleri keşfedin"
      />
      <div className="container mx-auto grid gap-6 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <div
            key={cat.slug}
            className="overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <CategoryCircleLink
              category={cat}
              size="lg"
              showCount
              className="p-8"
            />
          </div>
        ))}
      </div>
    </>
  );
}
