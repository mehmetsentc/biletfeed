import { CategoryCircleLink } from '@/components/categories/category-circle-link';
import { getCategories } from '@/lib/services/events';

export async function CategoryExplore() {
  const categories = await getCategories();

  return (
    <section className="bg-background py-10">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold lg:text-3xl">Kategorileri Keşfet</h2>
        <div className="mt-5 flex gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:mt-8 [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <CategoryCircleLink
              key={cat.slug}
              category={cat}
              size="sm"
              className="min-w-[5.5rem] shrink-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
