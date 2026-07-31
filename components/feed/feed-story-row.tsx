import { FeedCoverImage } from '@/components/feed/feed-cover-image';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { feedBadgeClass, feedStoryShortLabel } from '@/lib/feed/constants';
import { formatFeedTimeLabel } from '@/lib/feed/format-date';
import type { FeedPostCard } from '@/lib/feed/types';
import { cn } from '@/lib/utils';

/** Haber satırı: küçük kapak + başlık/özet yanında — yüksek yoğunluk, yüksek okunabilirlik. */
export function FeedStoryRow({
  post,
  dense = false
}: {
  post: FeedPostCard;
  dense?: boolean;
}) {
  const label = feedStoryShortLabel(post.categorySlug, post.categoryName, post.contentType);
  const summary = post.summary?.trim();

  return (
    <Link
      href={`/feed/${post.slug}`}
      className={cn(
        'group flex gap-3 border-b border-border/80 py-4 transition last:border-b-0 hover:bg-muted/30 sm:gap-4',
        dense ? 'py-3' : 'py-4 sm:py-5'
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-xl bg-muted',
          dense ? 'h-[72px] w-[96px] sm:h-20 sm:w-[112px]' : 'h-[88px] w-[118px] sm:h-[104px] sm:w-[148px]'
        )}
      >
        <FeedCoverImage
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          sizes="148px"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide',
              feedBadgeClass(post.categorySlug, post.contentType)
            )}
          >
            {label}
          </span>
          {post.publishedAt && (
            <time
              dateTime={post.publishedAt}
              className="text-[11px] font-medium text-muted-foreground"
            >
              {formatFeedTimeLabel(post.publishedAt)}
            </time>
          )}
        </div>

        <h3
          className={cn(
            'font-bold leading-snug text-foreground transition group-hover:text-[var(--bf-accent-ink)]',
            dense
              ? 'line-clamp-2 text-[15px] sm:text-base'
              : 'line-clamp-2 text-base sm:text-[1.0625rem] md:text-lg'
          )}
        >
          {post.title}
        </h3>

        {summary ? (
          <p
            className={cn(
              'mt-1 text-muted-foreground',
              dense
                ? 'line-clamp-1 text-[13px] leading-snug'
                : 'line-clamp-2 text-[13px] leading-relaxed sm:text-sm'
            )}
          >
            {summary}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {post.readingTimeMinutes} dk
          </span>
          {post.cityName && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span>{post.cityName}</span>
            </>
          )}
          {post.eventTitle && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="truncate text-[var(--bf-accent-ink)]">{post.eventTitle}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
