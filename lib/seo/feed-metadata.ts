import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo/metadata';
import type { FeedPostDetail } from '@/lib/feed/types';
import { FEED_POST_TYPE_LABELS, isMissingFeedCoverImage } from '@/lib/feed/constants';
import { siteConfig } from '@/lib/config/site';
import { getDefaultOgImage } from '@/lib/seo/constants';

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

  const coverOk = !isMissingFeedCoverImage(post.coverImage);
  const base = createPageMetadata({
    title,
    description,
    path: `/feed/${post.slug}`,
    image: coverOk ? post.coverImage : undefined,
    keywords: [
      ...seoKeywords,
      FEED_POST_TYPE_LABELS[post.contentType],
      ...(post.tags ?? []),
      post.cityName ?? '',
      post.artistName ?? ''
    ].filter(Boolean)
  });

  const ogImage = coverOk ? post.coverImage : getDefaultOgImage();
  const publishedTime = post.publishedAt ?? undefined;
  const modifiedTime = post.updatedAt || publishedTime;

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: 'article',
      title,
      description,
      url: `${siteConfig.url}/feed/${post.slug}`,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      authors: [post.authorName || siteConfig.name]
    },
    twitter: {
      ...base.twitter,
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage]
    }
  };
}
