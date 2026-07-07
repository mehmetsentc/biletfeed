import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';
import { FEED_CATEGORY_BADGE_COLORS, FEED_POST_TYPE_LABELS } from '@/lib/feed/constants';
import { formatFeedTimeLabel } from '@/lib/feed/format-date';
import type { FeedPostCard } from '@/lib/feed/types';
import { cn } from '@/lib/utils';

function badgeClass(categorySlug: string | null, contentType: string): string {
  if (categorySlug && FEED_CATEGORY_BADGE_COLORS[categorySlug]) {
    return FEED_CATEGORY_BADGE_COLORS[categorySlug];
  }
  return 'bg-primary';
}

export function FeedBillboardHero({ post }: { post: FeedPostCard }) {
  const label = post.categoryName ?? FEED_POST_TYPE_LABELS[post.contentType];

  return (
    <Link
      href={`/feed/${post.slug}`}
      className="group relative block overflow-hidden rounded-2xl bg-zinc-900 md:rounded-3xl"
    >
      <div className="relative aspect-[4/5] sm:aspect-[16/10]">
        <Image
          src={post.coverImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80'}
          alt={post.title}
          fill
          priority
          className="object-cover transition duration-700 group-hover:scale-[1.02]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-5 pb-6 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white',
                badgeClass(post.categorySlug, post.contentType)
              )}
            >
              <Sparkles className="size-3" />
              {label}
            </span>
            {post.isFeatured && (
              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                Manşet
              </span>
            )}
          </div>

          <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
            {post.title}
          </h2>

          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/75 sm:text-base">
            {post.summary}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-white/60">
              <span className="font-semibold text-white/90">{post.authorName}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {post.readingTimeMinutes} dk
              </span>
              {post.publishedAt && (
                <span>{formatFeedTimeLabel(post.publishedAt)}</span>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
              Oku
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
