import Link from 'next/link';
import { PageHero } from '@/components/layout/page-hero';
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
          <Link
            key={cat.slug}
            href={`/kategoriler/${cat.slug}`}
            className="group overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex flex-col items-center p-8">
              <span className="text-5xl transition-transform group-hover:scale-110">
                {cat.icon}
              </span>
              <h2 className="mt-4 text-lg font-bold">{cat.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {cat.count} etkinlik
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
