import { FeedCoverImage } from '@/components/feed/feed-cover-image';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
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

const SIZE_STYLES = {
  large: { aspect: 'aspect-[16/10]', title: 'text-2xl lg:text-3xl', pad: 'p-6', lines: 'line-clamp-2' },
  medium: { aspect: 'aspect-[4/3]', title: 'text-base lg:text-lg', pad: 'p-4', lines: 'line-clamp-2' },
  small: { aspect: 'aspect-[16/10]', title: 'text-sm', pad: 'p-3', lines: 'line-clamp-2' }
} as const;

/** Dergi tarzı görsel-üstü başlık kartı — yalnızca masaüstü Feed düzeninde kullanılır. */
export function FeedMagazineCard({
  post,
  size = 'medium'
}: {
  post: FeedPostCard;
  size?: 'large' | 'medium' | 'small';
}) {
  const label = post.categoryName ?? FEED_POST_TYPE_LABELS[post.contentType];
  const dateLabel = formatFeedTimelineDate(post.publishedAt);
  const s = SIZE_STYLES[size];

  return (
    <Link
      href={`/feed/${post.slug}`}
      className={cn(
        'group relative block overflow-hidden rounded-xl bg-zinc-900 shadow-sm ring-1 ring-border/60 transition hover:ring-primary/40',
        s.aspect
      )}
    >
      <FeedCoverImage
        src={post.coverImage}
        alt={post.title}
        fill
        className="object-cover transition duration-500 group-hover:scale-[1.03]"
        sizes={
          size === 'large'
            ? '(max-width: 1024px) 100vw, 50vw'
            : '(max-width: 1024px) 50vw, 33vw'
        }
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

      <span
        className={cn(
          'absolute left-3 top-3 rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
          badgeClass(post.categorySlug, post.contentType)
        )}
      >
        {label}
      </span>

      <div className={cn('absolute inset-x-0 bottom-0 text-white', s.pad)}>
        <h3 className={cn('font-bold leading-snug drop-shadow-sm', s.title, s.lines)}>
          {post.title}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-white/70">
          <span>{dateLabel}</span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" />
            {post.commentCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
