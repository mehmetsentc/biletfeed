import { FeedCoverImage } from '@/components/feed/feed-cover-image';
import Link from 'next/link';
import { Bookmark, Clock, Eye, Heart } from 'lucide-react';
import { FEED_CATEGORY_BADGE_COLORS, FEED_POST_TYPE_LABELS } from '@/lib/feed/constants';
import { formatFeedTimelineDate } from '@/lib/feed/format-date';
import type { FeedPostCard } from '@/lib/feed/types';
import { cn } from '@/lib/utils';

function badgeClass(categorySlug: string | null, contentType: string): string {
  if (categorySlug && FEED_CATEGORY_BADGE_COLORS[categorySlug]) {
    return FEED_CATEGORY_BADGE_COLORS[categorySlug];
  }
  return 'bg-primary';
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
    <article className="relative flex gap-4">
      {/* Timeline rail */}
      <div className="relative flex w-10 shrink-0 flex-col items-center">
        {!isFirst && (
          <div className="absolute bottom-full top-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-primary/60" />
        )}
        <div className="relative z-10 mt-1 flex size-10 shrink-0 flex-col items-center justify-center">
          <div className="absolute size-10 rounded-full bg-primary/10" />
          <div className="size-3 rounded-full border-2 border-primary bg-[#0c1017] shadow-[0_0_12px_rgba(245,166,35,0.45)]" />
        </div>
        {!isLast && (
          <div className="mt-1 w-px flex-1 min-h-[2rem] bg-gradient-to-b from-primary/60 via-primary/25 to-primary/10" />
        )}
        <time
          dateTime={post.publishedAt ?? undefined}
          className="mt-2 w-10 text-center text-[10px] font-bold leading-tight text-primary/90"
        >
          {dateLabel.split(' ').map((part, i) => (
            <span key={i} className="block">
              {part}
            </span>
          ))}
        </time>
      </div>

      {/* Billboard card */}
      <Link
        href={`/feed/${post.slug}`}
        className="group mb-8 min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/8 bg-zinc-900/80 shadow-lg transition hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <FeedCoverImage
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) calc(100vw - 4rem), 400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <span
            className={cn(
              'absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white',
              badgeClass(post.categorySlug, post.contentType)
            )}
          >
            {label}
          </span>
        </div>

        <div className="p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
            <span className="font-semibold text-zinc-300">{post.authorName}</span>
            <span className="text-zinc-600">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {post.readingTimeMinutes} dk
            </span>
            <span className="text-zinc-600">·</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3" />
              {post.viewCount.toLocaleString('tr-TR')}
            </span>
          </div>

          <h3 className="text-base font-bold leading-snug text-white transition group-hover:text-primary">
            {post.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400">
            {post.summary}
          </p>

          {post.eventTitle && (
            <p className="mt-2 text-xs font-medium text-primary/90">
              {post.eventTitle}
            </p>
          )}

          <div className="mt-3 flex items-center gap-4 border-t border-white/5 pt-3 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Heart className="size-3.5" />
              {post.likeCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Bookmark className="size-3.5" />
              Kaydet
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
