import Link from 'next/link';
import { FeedCoverImage } from '@/components/feed/feed-cover-image';
import { formatFeedTimelineDate } from '@/lib/feed/format-date';
import type { FeedPostCard } from '@/lib/feed/types';

/** Masaüstü Feed düzeninin sağ kenar çubuğu — "Son Haberler" listesi. */
export function FeedRecentSidebar({ posts }: { posts: FeedPostCard[] }) {
  if (posts.length === 0) return null;

  return (
    <aside className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
        Son Haberler
      </h2>
      <div className="space-y-1">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/feed/${post.slug}`}
            className="group flex items-center gap-3 rounded-lg p-1.5 transition hover:bg-muted/60"
          >
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
              <FeedCoverImage
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition group-hover:text-primary">
                {post.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatFeedTimelineDate(post.publishedAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
