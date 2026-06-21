import Link from 'next/link';
import { categories } from '@/lib/data/mock-events';

export function CategoryExplore() {
  const display = categories.slice(0, 6);

  return (
    <section className="bg-background py-10">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold lg:text-3xl">Kategorileri Keşfet</h2>
        <div className="mt-5 flex gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:mt-8 md:grid md:grid-cols-6 md:gap-6 md:overflow-visible [&::-webkit-scrollbar]:hidden">
          {display.map((cat) => (
            <Link
              key={cat.slug}
              href={`/kategoriler/${cat.slug}`}
              className="group flex min-w-[5.5rem] shrink-0 flex-col items-center gap-2.5 text-center md:min-w-0"
            >
              <div className="relative size-[4.5rem] overflow-hidden rounded-full ring-2 ring-border transition-all group-hover:ring-primary md:size-24 lg:size-28">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="size-full object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <span className="text-xs font-medium leading-tight text-foreground sm:text-sm">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
