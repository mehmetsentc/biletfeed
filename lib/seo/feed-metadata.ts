import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo/metadata';
import type { FeedPostDetail } from '@/lib/feed/types';
import { FEED_POST_TYPE_LABELS } from '@/lib/feed/constants';

export function createFeedListMetadata(): Metadata {
  return createPageMetadata({
    title: 'Feed — Etkinlik Haberleri ve Keşif',
    description:
      'Konser haberleri, festival gündemi, sanatçı duyuruları ve etkinlik rehberleri. BiletFeed Feed ile her gün yeni bir keşif.',
    path: '/feed',
    keywords: ['etkinlik haberleri', 'konser haberleri', 'festival', 'müzik', 'biletfeed feed']
  });
}

export function createFeedArticleMetadata(post: FeedPostDetail): Metadata {
  const title = post.seo?.title ?? post.title;
  const description = post.seo?.description ?? post.summary;
  const seoKeywordsRaw = post.seo?.keywords;
  const seoKeywords =
    typeof seoKeywordsRaw === 'string'
      ? seoKeywordsRaw.split(',').map((k) => k.trim()).filter(Boolean)
      : Array.isArray(seoKeywordsRaw)
        ? seoKeywordsRaw.filter((k): k is string => typeof k === 'string')
        : [];

  return createPageMetadata({
    title,
    description,
    path: `/feed/${post.slug}`,
    image: post.coverImage,
    keywords: [
      ...seoKeywords,
      FEED_POST_TYPE_LABELS[post.contentType],
      ...(post.tags ?? []),
      post.cityName ?? '',
      post.artistName ?? ''
    ].filter(Boolean)
  });
}
