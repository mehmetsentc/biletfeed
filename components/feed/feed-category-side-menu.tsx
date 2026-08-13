'use client';

import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';

type CategoryItem = {
  slug: string;
  name: string;
  shortName?: string;
  count: number;
};

/** iPad / tablet — dikey kategori menüsü (yatay chip yerine, tıklanabilir). */
export function FeedCategorySideMenu({
  categories,
  activeSlug
}: {
  categories: CategoryItem[];
  activeSlug?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Haber kategorileri"
      className="sticky top-20 rounded-2xl border border-border bg-card/80 p-3 shadow-sm backdrop-blur"
    >
      <p className="mb-3 flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        <Newspaper className="size-3.5 text-primary" aria-hidden />
        Kategoriler
      </p>
      <ul className="space-y-1">
        <li>
          <Link
            href="/feed"
            className={cn(
              'flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-sm font-semibold transition',
              !activeSlug
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span>Tümü</span>
          </Link>
        </li>
        {categories.map((cat) => {
          const active = cat.slug === activeSlug;
          return (
            <li key={cat.slug}>
              <Link
                href={`/feed?kategori=${encodeURIComponent(cat.slug)}`}
                className={cn(
                  'flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-sm font-semibold transition',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="truncate">{cat.shortName ?? cat.name}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                    active ? 'bg-black/15' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {cat.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
