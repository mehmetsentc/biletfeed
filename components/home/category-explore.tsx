import { CategoryCircleLink } from '@/components/categories/category-circle-link';
import { getCategories } from '@/lib/services/events';

export async function CategoryExplore() {
  const categories = await getCategories();

  return (
    <section className="bg-background py-10">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-xl font-bold lg:text-3xl">Kategorileri Keşfet</h2>

        {/* Mobile: yatay scroll — Desktop: ortalı wrap */}
        <div className="mt-6 md:mt-8">
          {/* Mobile scroll wrapper */}
          <div className="flex gap-4 overflow-x-auto px-1 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
            {categories.map((cat) => (
              <CategoryCircleLink
                key={cat.slug}
                category={cat}
                size="sm"
                className="min-w-[4.5rem] shrink-0"
              />
            ))}
          </div>

          {/* Desktop: ortala */}
          <div className="hidden flex-wrap justify-center gap-x-8 gap-y-6 md:flex">
            {categories.map((cat) => (
              <CategoryCircleLink
                key={cat.slug}
                category={cat}
                size="sm"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
