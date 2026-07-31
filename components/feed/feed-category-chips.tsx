import Link from 'next/link';
import { cn } from '@/lib/utils';

export function FeedCategoryChips({
  categories,
  activeSlug
}: {
  categories: Array<{ slug: string; name: string; shortName?: string; count: number }>;
  activeSlug?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Haber kategorileri"
      className="sticky top-0 z-20 -mx-4 mb-6 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:static md:mx-0 md:mb-8 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none"
    >
      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/feed"
          className={cn(
            'shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition',
            !activeSlug
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
        >
          Tümü
        </Link>
        {categories.map((cat) => {
          const isActive = cat.slug === activeSlug;
          const label = cat.shortName ?? cat.name;
          return (
            <Link
              key={cat.slug}
              href={`/feed?kategori=${encodeURIComponent(cat.slug)}`}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                  isActive ? 'bg-black/15 text-inherit' : 'bg-muted text-muted-foreground'
                )}
              >
                {cat.count}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
