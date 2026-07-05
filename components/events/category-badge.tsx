import {
  getCategoryBadgeStyle,
  getCategoryOverlayStyle
} from '@/lib/categories/badge-styles';
import { cn } from '@/lib/utils';

export function CategoryBadge({
  slug,
  label,
  variant = 'default',
  className
}: {
  slug: string;
  label: string;
  variant?: 'default' | 'overlay';
  className?: string;
}) {
  if (variant === 'overlay') {
    const style = getCategoryOverlayStyle(slug);
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
          style.bg,
          style.text,
          style.shadow,
          style.ring,
          className
        )}
      >
        {label}
      </span>
    );
  }

  const style = getCategoryBadgeStyle(slug);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 backdrop-blur-sm',
        style.bg,
        style.text,
        style.ring,
        className
      )}
    >
      {label}
    </span>
  );
}
