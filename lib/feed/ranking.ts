import type { FeedPostCard } from '@/lib/feed/types';
import { meetsFeaturedQualityBar, scoreFeedContentQuality } from '@/lib/feed/quality';
import { isMissingFeedCoverImage } from '@/lib/feed/constants';

function normalizeTr(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function postMatchesCity(post: FeedPostCard, preferredCityName: string): boolean {
  const city = normalizeTr(preferredCityName);
  if (!city) return false;
  if (post.cityName && normalizeTr(post.cityName) === city) return true;
  if (post.tags.some((t) => normalizeTr(t) === city || normalizeTr(t).includes(city))) return true;
  // Başlık / özette şehir adı (yumuşak sinyal)
  const hay = normalizeTr(`${post.title} ${post.summary}`);
  return hay.includes(city);
}

/**
 * Soft city boost: `bf_city` cookie / CityProvider seçimine uyan haberler
 * pencere içinde biraz öne alınır — sert filtre değil; diğer şehirler listede kalır.
 * Yalnızca ilk sayfa / pencere yeniden sıralaması için kullanın (cursor sayfalarında atlayın).
 */
export function applyCitySoftBoost<T extends FeedPostCard>(
  posts: T[],
  preferredCityName?: string | null
): T[] {
  if (!preferredCityName?.trim() || posts.length < 2) return posts;

  const matched: T[] = [];
  const rest: T[] = [];
  for (const post of posts) {
    if (postMatchesCity(post, preferredCityName)) matched.push(post);
    else rest.push(post);
  }
  if (matched.length === 0) return posts;
  // Soft: eşleşenler pencerenin başına; diğer şehirler listede kalır (hard filter yok)
  return [...matched, ...rest];
}

/** Kart sinyallerinden kalite skoru (gövde yoksa summary + readingTime + cover). */
export function cardQualityScore(post: FeedPostCard): number {
  return scoreFeedContentQuality({
    coverImage: post.coverImage,
    summary: post.summary,
    readingTimeMinutes: post.readingTimeMinutes,
    content: ''
  }).score + (post.isFeatured ? 10 : 0);
}

/**
 * Manşet sonrası “Öne çıkanlar” rayı: gerçek kapak + kalite tercih, en fazla 2–3 kart.
 */
export function pickFeaturedRail(
  posts: FeedPostCard[],
  max = 3
): { featured: FeedPostCard[]; remainder: FeedPostCard[] } {
  const capped = Math.min(3, Math.max(2, max));
  const withCover = posts.filter((p) => !isMissingFeedCoverImage(p.coverImage));
  const ranked = [...withCover].sort((a, b) => {
    const qa = meetsFeaturedQualityBar({
      coverImage: a.coverImage,
      summary: a.summary,
      readingTimeMinutes: a.readingTimeMinutes
    })
      ? 1
      : 0;
    const qb = meetsFeaturedQualityBar({
      coverImage: b.coverImage,
      summary: b.summary,
      readingTimeMinutes: b.readingTimeMinutes
    })
      ? 1
      : 0;
    if (qb !== qa) return qb - qa;
    return cardQualityScore(b) - cardQualityScore(a);
  });

  const featured = ranked.slice(0, capped);
  const featuredIds = new Set(featured.map((p) => p.id));
  const remainder = posts.filter((p) => !featuredIds.has(p.id));
  return { featured, remainder };
}
