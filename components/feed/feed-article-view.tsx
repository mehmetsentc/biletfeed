import Image from 'next/image';
import Link from 'next/link';
import { Clock, Heart, MessageCircle } from 'lucide-react';
import { FeedCoverImage } from '@/components/feed/feed-cover-image';
import { FeedMarkdown } from '@/components/feed/feed-markdown';
import { FeedPostCardView } from '@/components/feed/feed-post-card';
import { FeedEventCta } from '@/components/feed/feed-event-cta';
import { FEED_POST_TYPE_LABELS, isMissingFeedCoverImage } from '@/lib/feed/constants';
import { resolveFeedEventSlug } from '@/lib/feed/resolve-event-link';
import { formatFeedSourceLabel } from '@/lib/feed/source-display';
import { sanitizeFeedTags } from '@/lib/feed/tags';
import type { FeedPostDetail } from '@/lib/feed/types';

function GalleryFigure({
  item
}: {
  item: FeedPostDetail['media'][number];
}) {
  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-muted/30">
      <div className="relative aspect-video overflow-hidden">
        {item.type === 'video' ? (
          <video
            src={item.url}
            controls
            className="size-full object-cover"
            poster={item.thumbnail ?? undefined}
          />
        ) : item.type === 'embed' ? (
          <iframe
            src={item.url}
            title={item.alt ?? 'Video'}
            className="size-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <Image src={item.url} alt={item.alt ?? ''} fill className="object-cover" unoptimized />
        )}
      </div>
      {item.caption && (
        <figcaption className="px-3 py-2 text-xs text-muted-foreground">{item.caption}</figcaption>
      )}
    </figure>
  );
}

function GalleryGrid({ items }: { items: FeedPostDetail['media'] }) {
  if (items.length === 0) return null;
  return (
    <div className="my-8 grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <GalleryFigure key={item.id} item={item} />
      ))}
    </div>
  );
}

export function FeedArticleView({ post }: { post: FeedPostDetail }) {
  const typeLabel = FEED_POST_TYPE_LABELS[post.contentType];
  const hasCover = !isMissingFeedCoverImage(post.coverImage);
  const tags = sanitizeFeedTags(post.tags);
  const source = formatFeedSourceLabel({
    sourceName: post.sourceName,
    sourceUrl: post.sourceUrl,
    sourceAttribution: post.sourceAttribution
  });

  const seoKeywords = Array.isArray(post.seo.keywords)
    ? post.seo.keywords.map(String).filter(Boolean)
    : typeof post.seo.keywords === 'string'
      ? post.seo.keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean)
      : [];

  // Galeri: ilk dilim ilk H2 sonrası, kalanı gövde sonu — altta yığın yok
  const midGallery = post.media.slice(0, Math.min(2, post.media.length));
  const endGallery = post.media.slice(midGallery.length);

  const eventSlug = resolveFeedEventSlug({
    eventSlug: post.eventSlug,
    eventId: post.eventId,
    seo: post.seo
  });

  const ticketCallout = (
    <FeedEventCta
      eventSlug={eventSlug}
      eventTitle={post.eventTitle}
      eventHasTickets={post.eventHasTickets}
      contentType={post.contentType}
      cityName={post.cityName}
      venueName={post.venueName}
      artistName={post.artistName}
      tags={tags}
      content={post.content}
    />
  );

  return (
    <article className="pb-24">
      {hasCover ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
          <FeedCoverImage src={post.coverImage} alt={post.title} fill className="object-cover" priority />
        </div>
      ) : null}

      <div className={hasCover ? 'mt-6' : 'mt-0'}>
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
          {typeLabel}
        </span>
        <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground md:text-4xl">{post.title}</h1>
        {post.headline && post.headline !== post.title && (
          <p className="mt-2 text-lg text-muted-foreground">{post.headline}</p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{post.authorName}</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-4" />
          {post.readingTimeMinutes} dk okuma
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

      {post.summary?.trim() ? (
        <p className="mt-8 max-w-3xl text-xl font-medium leading-[1.65] tracking-[-0.01em] text-muted-foreground md:mt-10 md:text-[1.35rem] md:leading-[1.7]">
          {post.summary.trim()}
        </p>
      ) : null}

      {/* Erken callout — etkinlik sinyali varsa özet sonrası */}
      {(eventSlug || post.artistName || post.cityName) && ticketCallout}

      <div className={post.summary?.trim() ? 'mt-8' : 'mt-6'}>
        <FeedMarkdown
          content={post.content}
          title={post.title}
          afterFirstH2={midGallery.length > 0 ? <GalleryGrid items={midGallery} /> : undefined}
          beforeEnd={
            <>
              {endGallery.length > 0 ? <GalleryGrid items={endGallery} /> : null}
              {/* Gövde sonu callout — üstte gösterilmediyse */}
              {!eventSlug && !post.artistName && !post.cityName ? ticketCallout : null}
            </>
          }
        />
      </div>

      <footer className="mt-12 space-y-6 border-t border-border pt-8">
        {source.label && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground/80">Kaynak</span>
            <span className="mx-2 text-border">·</span>
            {source.href ? (
              <Link
                href={source.href}
                className="text-[var(--bf-accent-ink)] underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.label}
              </Link>
            ) : (
              <span>{source.label}</span>
            )}
          </p>
        )}

        {tags.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Etiketler
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {seoKeywords.length > 0 && (
          <p className="text-xs leading-relaxed text-muted-foreground/70">
            <span className="font-medium text-muted-foreground">Konular</span>
            <span className="mx-1.5">·</span>
            {seoKeywords.slice(0, 8).join(' · ')}
          </p>
        )}
      </footer>

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
    </article>
  );
}
