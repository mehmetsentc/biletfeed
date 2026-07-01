import type { FeedPostType, FeedPostStatus } from '@prisma/client';

export type FeedPostCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImage: string;
  contentType: FeedPostType;
  authorName: string;
  readingTimeMinutes: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string | null;
  isFeatured: boolean;
  categorySlug: string | null;
  categoryName: string | null;
  eventSlug: string | null;
  eventTitle: string | null;
  cityName: string | null;
  tags: string[];
};

export type FeedPostDetail = FeedPostCard & {
  headline: string | null;
  content: string;
  excerpt: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  sourceAttribution: string | null;
  bookmarkCount: number;
  shareCount: number;
  artistName: string | null;
  organizerSlug: string | null;
  organizerName: string | null;
  venueName: string | null;
  eventId: string | null;
  eventHasTickets: boolean;
  media: Array<{
    id: string;
    type: string;
    url: string;
    thumbnail: string | null;
    alt: string | null;
    caption: string | null;
  }>;
  relatedPosts: FeedPostCard[];
  seo: Record<string, string>;
};

export type EditorialQueueItem = {
  id: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceSnippet: string | null;
  sourceName: string | null;
  status: string;
  stage: string;
  postId: string | null;
  errorMessage: string | null;
  createdAt: string;
  post?: { slug: string; title: string; status: FeedPostStatus } | null;
};
