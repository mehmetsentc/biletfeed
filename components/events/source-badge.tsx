import { cn } from '@/lib/utils';

/** Glass platform / source badge (BUBILET, Bilet Feed, etc.) */
export function SourceBadge({
  label,
  className
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg border border-white/25 bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur-md',
        className
      )}
    >
      {label}
    </span>
  );
}
