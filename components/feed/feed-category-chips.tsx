import Link from 'next/link';
import { cn } from '@/lib/utils';

export function FeedCategoryChips({
  categories,
  activeSlug
}: {
  categories: Array<{ slug: string; name: string; count: number }>;
  activeSlug?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0">
      <Link
        href="/feed"
        className={cn(
          'shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition',
          !activeSlug
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-card text-muted-foreground hover:text-foreground'
        )}
      >
        Tümü
      </Link>
      {categories.map((cat) => {
        const isActive = cat.slug === activeSlug;
        return (
          <Link
            key={cat.slug}
            href={`/feed?kategori=${encodeURIComponent(cat.slug)}`}
            className={cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            {cat.name}
          </Link>
        );
      })}
    </div>
  );
}
