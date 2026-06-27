import { cn } from '@/lib/utils';
import { getCategoryIconConfig } from '@/lib/categories/icons';

type CategoryIconSize = 'ribbon' | 'sm' | 'md' | 'lg' | 'xl';

const containerSizes: Record<CategoryIconSize, string> = {
  ribbon: 'size-[4.5rem]',
  sm: 'size-16 md:size-20',
  md: 'size-[4.5rem] md:size-24 lg:size-28',
  lg: 'size-24 md:size-28 lg:size-32',
  xl: 'size-16 md:size-[4.5rem]'
};

const iconSizes: Record<CategoryIconSize, string> = {
  ribbon: 'size-6',
  sm: 'size-6 md:size-7',
  md: 'size-7 md:size-8',
  lg: 'size-8 md:size-9 lg:size-10',
  xl: 'size-7 md:size-8'
};

interface CategoryIconProps {
  slug: string;
  size?: CategoryIconSize;
  className?: string;
  showRing?: boolean;
}

export function CategoryIcon({
  slug,
  size = 'md',
  className,
  showRing = true
}: CategoryIconProps) {
  const { Icon } = getCategoryIconConfig(slug);

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        'bg-zinc-100 dark:bg-[#1b1b1b]',
        showRing &&
          'ring-2 ring-orange-500/25 transition-all duration-200 group-hover:ring-orange-500/60 group-hover:shadow-[0_0_20px_rgba(255,153,0,0.25)]',
        containerSizes[size],
        className
      )}
    >
      <Icon
        className={cn(iconSizes[size], 'text-[#FF9900]')}
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}
