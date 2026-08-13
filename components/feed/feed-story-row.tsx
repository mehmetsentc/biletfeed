import { FeedCoverImage } from '@/components/feed/feed-cover-image';
import { FeedCardMeta } from '@/components/feed/feed-card-meta';
import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import { feedBadgeClass, feedStoryShortLabel, isMissingFeedCoverImage } from '@/lib/feed/constants';
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
  const hasCover = !isMissingFeedCoverImage(post.coverImage);

  return (
    <Link
      href={`/feed/${post.slug}`}
      className={cn(
        'group flex gap-3 border-b border-border/80 transition last:border-b-0 hover:bg-muted/30 sm:gap-4 md:gap-5',
        dense ? 'py-3' : 'py-4 sm:py-5 md:py-5',
        !hasCover && 'rounded-lg px-1 sm:px-1.5'
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-xl',
          hasCover
            ? dense
              ? 'h-[72px] w-[96px] bg-muted sm:h-20 sm:w-[112px]'
              : 'h-[88px] w-[118px] bg-muted sm:h-[104px] sm:w-[148px] md:h-[112px] md:w-[160px]'
            : 'flex h-14 w-14 flex-col items-center justify-center border border-dashed border-border/80 bg-muted/40 text-muted-foreground/60 sm:h-[3.75rem] sm:w-[3.75rem]'
        )}
      >
        {hasCover ? (
          <FeedCoverImage
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="148px"
          />
        ) : (
          <ImageOff className="size-3.5" aria-hidden />
        )}
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

        <FeedCardMeta
          categoryLabel={label}
          readingTimeMinutes={post.readingTimeMinutes}
          publishedAt={post.publishedAt}
          omitCategory
          className="mt-2"
          trailing={
            post.eventTitle ? (
              <>
                <span className="text-muted-foreground/45" aria-hidden>
                  ·
                </span>
                <span className="truncate text-[var(--bf-accent-ink)]">{post.eventTitle}</span>
              </>
            ) : post.cityName ? (
              <>
                <span className="text-muted-foreground/45" aria-hidden>
                  ·
                </span>
                <span>{post.cityName}</span>
              </>
            ) : null
          }
        />
      </div>
    </Link>
  );
}
