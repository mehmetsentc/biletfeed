import Link from 'next/link';
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
          <div className="flex size-[72px] items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 transition-all group-hover:scale-105 group-hover:ring-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10">
            <span className="text-2xl">{cat.icon}</span>
          </div>
          <span className="text-center text-xs font-medium text-foreground md:text-sm">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
