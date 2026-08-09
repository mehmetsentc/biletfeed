import { FeedCoverImage } from '@/components/feed/feed-cover-image';
import Link from 'next/link';
import { feedBadgeClass, feedStoryShortLabel, isMissingFeedCoverImage } from '@/lib/feed/constants';
import { formatFeedTimeLabel } from '@/lib/feed/format-date';
import type { FeedPostCard } from '@/lib/feed/types';
import { cn } from '@/lib/utils';

/** İkincil öne çıkan: görsel üstte, metin altta (overlay yok). */
export function FeedFeatureTile({ post }: { post: FeedPostCard }) {
  const label = feedStoryShortLabel(post.categorySlug, post.categoryName, post.contentType);
  const summary = post.summary?.trim();
  const hasCover = !isMissingFeedCoverImage(post.coverImage);

  return (
    <Link
      href={`/feed/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/35"
    >
      {hasCover ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          <FeedCoverImage
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      ) : (
        <div className="h-12 border-b border-border bg-muted/50" aria-hidden />
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={cn(
              'rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide',
              feedBadgeClass(post.categorySlug, post.contentType)
            )}
          >
            {label}
          </span>
          {post.publishedAt && (
            <span className="text-[11px] text-muted-foreground">
              {formatFeedTimeLabel(post.publishedAt)}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground transition group-hover:text-[var(--bf-accent-ink)] md:text-[1.0625rem]">
          {post.title}
        </h3>
        {summary ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
