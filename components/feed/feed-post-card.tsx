import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, Clock, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import { FEED_CATEGORY_BADGE_COLORS, FEED_POST_TYPE_LABELS } from '@/lib/feed/constants';
import type { FeedPostCard } from '@/lib/feed/types';
import { cn } from '@/lib/utils';

function badgeClass(categorySlug: string | null, contentType: string): string {
  if (categorySlug && FEED_CATEGORY_BADGE_COLORS[categorySlug]) {
    return FEED_CATEGORY_BADGE_COLORS[categorySlug];
  }
  return 'bg-primary';
}

export function FeedPostCardView({
  post,
  featured = false
}: {
  post: FeedPostCard;
  featured?: boolean;
}) {
  const label = post.categoryName ?? FEED_POST_TYPE_LABELS[post.contentType];

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md',
        featured && 'md:col-span-2 md:grid md:grid-cols-2'
      )}
    >
      <Link
        href={`/feed/${post.slug}`}
        className={cn('relative block overflow-hidden', featured ? 'aspect-[16/10] md:aspect-auto md:min-h-[280px]' : 'aspect-[16/10]')}
      >
        <Image
          src={post.coverImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80'}
          alt={post.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes={featured ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span
          className={cn(
            'absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white shadow',
            badgeClass(post.categorySlug, post.contentType)
          )}
        >
          {label}
        </span>
        {post.isFeatured && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-black">
            Öne Çıkan
          </span>
        )}
      </Link>

      <div className={cn('flex flex-col p-4', featured && 'md:justify-center md:p-6')}>
        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{post.authorName}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {post.readingTimeMinutes} dk
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" />
            {post.viewCount.toLocaleString('tr-TR')}
          </span>
        </div>

        <Link href={`/feed/${post.slug}`}>
          <h2
            className={cn(
              'font-bold leading-snug text-foreground transition group-hover:text-primary',
              featured ? 'text-xl md:text-2xl' : 'text-base'
            )}
          >
            {post.title}
          </h2>
        </Link>

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.summary}</p>

        {post.eventTitle && (
          <p className="mt-3 text-xs font-medium text-primary">
            İlgili etkinlik: {post.eventTitle}
          </p>
        )}

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5" />
            {post.likeCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" />
            {post.commentCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Share2 className="size-3.5" />
            Paylaş
          </span>
          <span className="inline-flex items-center gap-1">
            <Bookmark className="size-3.5" />
            Kaydet
          </span>
        </div>
      </div>
    </article>
  );
}
