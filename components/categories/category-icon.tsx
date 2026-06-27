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
  sm: 'size-5 md:size-6',
  md: 'size-6 md:size-7',
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
  const { Icon, gradient, iconClass } = getCategoryIconConfig(slug);

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-inner',
        gradient,
        showRing &&
          'ring-2 ring-orange-500/20 transition-all group-hover:ring-orange-500/50 dark:ring-orange-500/25 dark:group-hover:ring-orange-400/60',
        containerSizes[size],
        className
      )}
    >
      <Icon
        className={cn(iconSizes[size], iconClass)}
        strokeWidth={1.75}
        aria-hidden
      />
    </div>
  );
}
