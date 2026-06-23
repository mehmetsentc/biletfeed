import { CategoryCircleLink } from '@/components/categories/category-circle-link';
import { categories } from '@/lib/data/mock-events';

export function CategoryExplore() {
  const display = categories.slice(0, 6);

  return (
    <section className="bg-background py-10">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold lg:text-3xl">Kategorileri Keşfet</h2>
        <div className="mt-5 flex gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:mt-8 md:grid md:grid-cols-6 md:gap-6 md:overflow-visible [&::-webkit-scrollbar]:hidden">
          {display.map((cat) => (
            <CategoryCircleLink
              key={cat.slug}
              category={cat}
              className="min-w-[5.5rem] shrink-0 md:min-w-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
