import { FeedCoverImage } from '@/components/feed/feed-cover-image';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import {
  FEED_CATEGORY_BADGE_COLORS,
  FEED_CATEGORY_BADGE_FALLBACK,
  FEED_POST_TYPE_LABELS
} from '@/lib/feed/constants';
import { formatFeedTimelineDate } from '@/lib/feed/format-date';
import type { FeedPostCard } from '@/lib/feed/types';
import { cn } from '@/lib/utils';

function badgeClass(categorySlug: string | null, contentType: string): string {
  if (categorySlug && FEED_CATEGORY_BADGE_COLORS[categorySlug]) {
    return FEED_CATEGORY_BADGE_COLORS[categorySlug];
  }
  return FEED_CATEGORY_BADGE_FALLBACK;
}

export function FeedTimelineCard({
  post,
  isFirst = false,
  isLast = false
}: {
  post: FeedPostCard;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const label = post.categoryName ?? FEED_POST_TYPE_LABELS[post.contentType];
  const dateLabel = formatFeedTimelineDate(post.publishedAt);

  return (
    <article className="relative flex gap-3">
      {/* Timeline rail */}
      <div className="relative flex w-10 shrink-0 flex-col items-center">
        {!isFirst && (
          <div className="absolute bottom-full top-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-primary/60" />
        )}
        <div className="relative z-10 mt-1 flex size-10 shrink-0 flex-col items-center justify-center">
          <div className="absolute size-10 rounded-full bg-primary/10" />
          <div className="size-3 rounded-full border-2 border-primary bg-background shadow-[0_0_12px_rgba(245,166,35,0.45)]" />
        </div>
        {!isLast && (
          <div className="mt-1 w-px flex-1 min-h-[2rem] bg-gradient-to-b from-primary/60 via-primary/25 to-primary/10" />
        )}
        <time
          dateTime={post.publishedAt ?? undefined}
          className="mt-2 w-10 text-center text-[10px] font-bold leading-tight text-[var(--bf-accent-ink)]/90"
        >
          {dateLabel.split(' ').map((part, i) => (
            <span key={i} className="block">
              {part}
            </span>
          ))}
        </time>
      </div>

      {/* Card */}
      <Link
        href={`/feed/${post.slug}`}
        className="group mb-4 flex min-w-0 flex-1 items-center gap-4 rounded-2xl border border-border bg-card p-3.5 shadow-lg transition hover:border-primary/30 hover:bg-muted"
      >
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl sm:size-28">
          <FeedCoverImage
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.05]"
            sizes="112px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <span
            className={cn(
              'inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
              badgeClass(post.categorySlug, post.contentType)
            )}
          >
            {label}
          </span>

          <h3 className="mt-2 line-clamp-3 text-lg font-bold leading-snug text-foreground transition group-hover:text-[var(--bf-accent-ink)]">
            {post.title}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate">{post.authorName}</span>
            <span className="shrink-0 text-muted-foreground/60">·</span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <Clock className="size-3.5" />
              {post.readingTimeMinutes} dk
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
