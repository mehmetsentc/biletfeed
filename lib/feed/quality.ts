import { isMissingFeedCoverImage } from '@/lib/feed/constants';

export type FeedQualitySignals = {
  h2Count: number;
  hasCover: boolean;
  hasList: boolean;
  hasSummary: boolean;
  readingTimeMinutes: number;
  /** 0–100 yaklaşık dergi kalitesi skoru */
  score: number;
  isLowQuality: boolean;
};

/**
 * Hafif içerik kalite sinyalleri — öne çıkan uygunluğu ve admin “kalite düşük” rozeti için.
 * H2 / liste sayısı markdown gövdesinden ucuz regex ile okunur.
 */
export function scoreFeedContentQuality(input: {
  content?: string | null;
  coverImage?: string | null;
  summary?: string | null;
  readingTimeMinutes?: number | null;
}): FeedQualitySignals {
  const content = input.content ?? '';
  const h2Count = (content.match(/^##\s+/gm) ?? []).length;
  const hasList = /^[-*]\s+/m.test(content) || /^\d+\.\s+/m.test(content);
  const hasCover = !isMissingFeedCoverImage(input.coverImage);
  const summary = (input.summary ?? '').trim();
  const hasSummary = summary.length >= 40;
  const readingTimeMinutes = Math.max(0, input.readingTimeMinutes ?? 0);

  let score = 0;
  if (hasCover) score += 30;
  if (hasSummary) score += 20;
  if (readingTimeMinutes >= 2) score += 15;
  if (readingTimeMinutes >= 4) score += 5;
  score += Math.min(25, h2Count * 8);
  if (hasList) score += 10;
  score = Math.min(100, score);

  // Kapak yok veya gövde iskeleti zayıfsa düşük kalite
  const isLowQuality = !hasCover || h2Count < 2 || !hasSummary || readingTimeMinutes < 2;

  return {
    h2Count,
    hasCover,
    hasList,
    hasSummary,
    readingTimeMinutes,
    score,
    isLowQuality
  };
}

/** Öne çıkan ray / featured için minimum dergi eşiği (kapak zorunlu). */
export function meetsFeaturedQualityBar(input: {
  content?: string | null;
  coverImage?: string | null;
  summary?: string | null;
  readingTimeMinutes?: number | null;
}): boolean {
  const q = scoreFeedContentQuality(input);
  return q.hasCover && q.hasSummary && q.readingTimeMinutes >= 2;
}
