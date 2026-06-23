import Link from 'next/link';
import { CategoryIcon } from '@/components/categories/category-icon';
import { cn } from '@/lib/utils';

export interface CategoryCircleItem {
  slug: string;
  name: string;
  image?: string | null;
  count?: number;
}

interface CategoryCircleLinkProps {
  category: CategoryCircleItem;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function CategoryCircleLink({
  category,
  size = 'md',
  showCount = false,
  className
}: CategoryCircleLinkProps) {
  return (
    <Link
      href={`/kategoriler/${category.slug}`}
      className={cn(
        'group flex flex-col items-center gap-2.5 text-center',
        className
      )}
    >
      <CategoryIcon
        slug={category.slug}
        size={size}
        className="transition-transform group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/10"
      />
      <span className="text-xs font-medium leading-tight text-foreground sm:text-sm">
        {category.name}
      </span>
      {showCount && category.count != null && (
        <p className="text-sm text-muted-foreground">{category.count} etkinlik</p>
      )}
    </Link>
  );
}
