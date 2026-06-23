import Link from 'next/link';
import { resolveCategoryImage } from '@/lib/data/category-images';
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

const circleSizes = {
  sm: 'size-[4.5rem] md:size-20',
  md: 'size-[4.5rem] md:size-24 lg:size-28',
  lg: 'size-24 md:size-28 lg:size-32'
};

export function CategoryCircleLink({
  category,
  size = 'md',
  showCount = false,
  className
}: CategoryCircleLinkProps) {
  const image = resolveCategoryImage(category.slug, category.image);

  return (
    <Link
      href={`/kategoriler/${category.slug}`}
      className={cn(
        'group flex flex-col items-center gap-2.5 text-center',
        className
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-full ring-2 ring-border transition-all group-hover:ring-primary',
          circleSizes[size]
        )}
      >
        <img
          src={image}
          alt={category.name}
          className="size-full object-cover transition-transform group-hover:scale-110"
        />
      </div>
      <span className="text-xs font-medium leading-tight text-foreground sm:text-sm">
        {category.name}
      </span>
      {showCount && category.count != null && (
        <p className="text-sm text-muted-foreground">{category.count} etkinlik</p>
      )}
    </Link>
  );
}
