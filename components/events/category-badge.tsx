import { getCategoryBadgeStyle } from '@/lib/categories/badge-styles';
import { cn } from '@/lib/utils';

export function CategoryBadge({
  slug,
  label,
  className
}: {
  slug: string;
  label: string;
  className?: string;
}) {
  const style = getCategoryBadgeStyle(slug);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 backdrop-blur-sm',
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
