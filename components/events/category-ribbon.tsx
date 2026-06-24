import Link from 'next/link';
import { CategoryIcon } from '@/components/categories/category-icon';
import { sortCategoriesByDisplayOrder } from '@/lib/categories/sort';
import { categories } from '@/lib/data/mock-events';
import { cn } from '@/lib/utils';

export function CategoryRibbon({ className }: { className?: string }) {
  const display = sortCategoriesByDisplayOrder(categories);
  return (
    <div
      className={cn(
        'flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      {display.map((cat) => (
        <Link
          key={cat.slug}
          href={`/kategoriler/${cat.slug}`}
          className="group flex min-w-[88px] flex-col items-center gap-2"
        >
          <CategoryIcon slug={cat.slug} size="ribbon" />
          <span className="text-center text-xs font-medium text-foreground md:text-sm">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
