import Image from 'next/image';
import Link from 'next/link';
import { Clock, Eye, Heart, MessageCircle } from 'lucide-react';
import { FeedPostCardView } from '@/components/feed/feed-post-card';
import { FeedEventCta } from '@/components/feed/feed-event-cta';
import { FEED_POST_TYPE_LABELS } from '@/lib/feed/constants';
import type { FeedPostDetail } from '@/lib/feed/types';

function renderContent(content: string) {
  return content.split('\n\n').map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={i} className="mt-8 text-xl font-bold text-foreground">
          {trimmed.replace(/^##\s+/, '')}
        </h2>
      );
    }
    return (
      <p key={i} className="mt-4 text-base leading-relaxed text-muted-foreground">
        {trimmed}
      </p>
    );
  });
}

export function FeedArticleView({ post }: { post: FeedPostDetail }) {
  const typeLabel = FEED_POST_TYPE_LABELS[post.contentType];

  return (
    <article className="pb-24">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
        <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold">{typeLabel}</span>
          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">{post.title}</h1>
          {post.headline && post.headline !== post.title && (
            <p className="mt-2 text-lg text-white/85">{post.headline}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{post.authorName}</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-4" />
          {post.readingTimeMinutes} dk okuma
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="size-4" />
          {post.viewCount.toLocaleString('tr-TR')}
        </span>
        <span className="inline-flex items-center gap-1">
          <Heart className="size-4" />
          {post.likeCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="size-4" />
          {post.commentCount}
        </span>
      </div>

      <p className="mt-6 text-lg leading-relaxed text-foreground">{post.summary}</p>

      <div className="prose-feed mt-8 max-w-none">{renderContent(post.content)}</div>

      {post.media.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-foreground">Galeri</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {post.media.map((item) => (
              <div key={item.id} className="relative aspect-video overflow-hidden rounded-xl">
                <Image src={item.url} alt={item.alt ?? ''} fill className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      {post.sourceAttribution && (
        <p className="mt-8 text-sm text-muted-foreground">
          {post.sourceAttribution}
          {post.sourceUrl && (
            <>
              {' '}
              <Link href={post.sourceUrl} className="text-primary underline" target="_blank" rel="noopener noreferrer">
                Kaynağı görüntüle
              </Link>
            </>
          )}
        </p>
      )}

      {post.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {post.relatedPosts.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-foreground">İlgili Hikâyeler</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {post.relatedPosts.map((related) => (
              <FeedPostCardView key={related.id} post={related} />
            ))}
          </div>
        </section>
      )}

      <FeedEventCta
        eventSlug={post.eventSlug}
        eventTitle={post.eventTitle}
        hasTickets={post.eventHasTickets}
      />
    </article>
  );
}
