import Link from 'next/link';
import { CategoryIcon } from '@/components/categories/category-icon';
import { cn } from '@/lib/utils';
import { categories } from '@/lib/data/mock-events';

export function CategoryRibbon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex gap-4 overflow-x-auto pb-2 scrollbar-none md:justify-center',
        className
      )}
    >
      {categories.map((cat) => (
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
