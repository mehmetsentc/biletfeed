import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatFeedTimeLabel } from '@/lib/feed/format-date';

/** Liste kartları için tutarlı meta: kategori · okuma · tarih */
export function FeedCardMeta({
  categoryLabel,
  readingTimeMinutes,
  publishedAt,
  className,
  trailing,
  /** Rozet zaten kategori gösteriyorsa metada tekrarlama */
  omitCategory = false
}: {
  categoryLabel?: string | null;
  readingTimeMinutes: number;
  publishedAt?: string | null;
  className?: string;
  trailing?: ReactNode;
  omitCategory?: boolean;
}) {
  const time = formatFeedTimeLabel(publishedAt ?? null);
  const showCategory = !omitCategory && Boolean(categoryLabel?.trim());

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground sm:text-xs',
        className
      )}
    >
      {showCategory ? (
        <>
          <span className="font-semibold text-foreground/80">{categoryLabel}</span>
          <span className="text-muted-foreground/45" aria-hidden>
            ·
          </span>
        </>
      ) : null}
      <span>{readingTimeMinutes} dk okuma</span>
      {time ? (
        <>
          <span className="text-muted-foreground/45" aria-hidden>
            ·
          </span>
          <time dateTime={publishedAt ?? undefined}>{time}</time>
        </>
      ) : null}
      {trailing}
    </div>
  );
}
