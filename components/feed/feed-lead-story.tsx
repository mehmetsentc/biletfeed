import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FeedCoverImage } from '@/components/feed/feed-cover-image';
import { FeedCardMeta } from '@/components/feed/feed-card-meta';
import { feedBadgeClass, feedStoryShortLabel, isMissingFeedCoverImage } from '@/lib/feed/constants';
import type { FeedPostCard } from '@/lib/feed/types';
import { cn } from '@/lib/utils';

/** Manşet: görsel üstte/solda, başlık + özet görselin altında — okunabilirlik öncelikli. */
export function FeedLeadStory({ post }: { post: FeedPostCard }) {
  const label = feedStoryShortLabel(post.categorySlug, post.categoryName, post.contentType);
  const summary = post.summary?.trim();
  const hasCover = !isMissingFeedCoverImage(post.coverImage);

  return (
    <Link
      href={`/feed/${post.slug}`}
      className={cn(
        'group grid overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/35',
        hasCover && 'md:grid-cols-[1.15fr_1fr]'
      )}
    >
      {hasCover ? (
        <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[320px]">
          <FeedCoverImage
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 55vw"
          />
        </div>
      ) : (
        <div className="flex h-14 items-center border-b border-border bg-muted/40 px-5 text-xs font-medium text-muted-foreground md:hidden">
          Kapak görseli yok
        </div>
      )}

      <div className="flex flex-col justify-center p-5 sm:p-6 md:p-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide',
              feedBadgeClass(post.categorySlug, post.contentType)
            )}
          >
            {label}
          </span>
          {post.isFeatured && (
            <span className="rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Manşet
            </span>
          )}
        </div>

        <h2 className="text-[1.375rem] font-extrabold leading-[1.25] tracking-tight text-foreground sm:text-2xl md:text-[1.75rem] md:leading-snug">
          {post.title}
        </h2>

        {summary ? (
          <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-muted-foreground md:text-base">
            {summary}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-3">
          <FeedCardMeta
            categoryLabel={label}
            readingTimeMinutes={post.readingTimeMinutes}
            publishedAt={post.publishedAt}
            omitCategory
            className="text-sm"
            trailing={
              post.cityName ? (
                <>
                  <span className="text-muted-foreground/45" aria-hidden>
                    ·
                  </span>
                  <span>{post.cityName}</span>
                </>
              ) : null
            }
          />
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[var(--bf-accent-ink)]">
            Oku
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
