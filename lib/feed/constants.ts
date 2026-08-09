import type { FeedPostType } from '@prisma/client';

export const FEED_AUTHOR_NAME = 'BiletFeed Editör';

/** Harici kapak görseli yüklenemediğinde kullanılan yedek */
export const FEED_FALLBACK_COVER =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80';

export const FEED_POST_TYPE_LABELS: Record<FeedPostType, string> = {
  concert_news: 'Konser Haberi',
  festival_news: 'Festival Haberi',
  music_news: 'Müzik Haberi',
  entertainment_news: 'Eğlence Haberi',
  artist_news: 'Sanatçı Haberi',
  event_announcement: 'Etkinlik Duyurusu',
  behind_the_scenes: 'Kulis',
  event_recap: 'Etkinlik Özeti',
  top_list: 'Liste',
  weekend_guide: 'Hafta Sonu Rehberi',
  city_guide: 'Şehir Rehberi',
  venue_guide: 'Mekan Rehberi',
  ticket_alert: 'Bilet Alarmı',
  trending_story: 'Trend',
  ai_opinion: 'Editör Yorumu',
  interview: 'Röportaj',
  photo_story: 'Foto Hikâye',
  video_story: 'Video Hikâye',
  organizer_update: 'Organizatör Duyurusu'
};

/** Kart / chip üzerinde kısa etiket — uzun "Konser Haberi" yerine taranabilir. */
export const FEED_POST_TYPE_SHORT_LABELS: Record<FeedPostType, string> = {
  concert_news: 'Konser',
  festival_news: 'Festival',
  music_news: 'Müzik',
  entertainment_news: 'Party',
  artist_news: 'Sanatçı',
  event_announcement: 'Etkinlik',
  behind_the_scenes: 'Kulis',
  event_recap: 'Özet',
  top_list: 'Liste',
  weekend_guide: 'Rehber',
  city_guide: 'Şehir',
  venue_guide: 'Mekan',
  ticket_alert: 'Bilet',
  trending_story: 'Trend',
  ai_opinion: 'Yorum',
  interview: 'Röportaj',
  photo_story: 'Foto',
  video_story: 'Video',
  organizer_update: 'Duyuru'
};

export const FEED_CATEGORY_SHORT_LABELS: Record<string, string> = {
  'konser-haberleri': 'Konser',
  'festival-haberleri': 'Festival',
  'muzik-haberleri': 'Müzik',
  'eglence-haberleri': 'Party',
  'etkinlik-duyurulari': 'Etkinlik',
  'trend-hikayeler': 'Trend'
};

/**
 * Kategori slug → eşleşen içerik tipleri.
 * Birçok haberde feedCategory boş kalabiliyor; filtre hem kategori hem tipe bakar.
 */
export const FEED_CATEGORY_CONTENT_TYPES: Record<string, FeedPostType[]> = {
  'konser-haberleri': ['concert_news'],
  'festival-haberleri': ['festival_news'],
  'muzik-haberleri': ['music_news', 'artist_news'],
  'eglence-haberleri': ['entertainment_news'],
  'etkinlik-duyurulari': ['event_announcement', 'ticket_alert', 'weekend_guide'],
  'trend-hikayeler': ['trending_story']
};

export function feedStoryShortLabel(
  categorySlug: string | null,
  categoryName: string | null,
  contentType: FeedPostType
): string {
  if (categorySlug && FEED_CATEGORY_SHORT_LABELS[categorySlug]) {
    return FEED_CATEGORY_SHORT_LABELS[categorySlug];
  }
  return FEED_POST_TYPE_SHORT_LABELS[contentType] ?? categoryName ?? 'Haber';
}

// Not: her giriş kendi okunabilir metin rengini de içerir (bg-primary artık neon
// olduğu için sabit text-white kontrastı bozuyordu, bu yüzden text rengi burada
// bg ile birlikte tanımlanıyor).
export const FEED_CATEGORY_BADGE_COLORS: Record<string, string> = {
  'konser-haberleri': 'bg-rose-600 text-white',
  'festival-haberleri': 'bg-purple-600 text-white',
  'muzik-haberleri': 'bg-indigo-600 text-white',
  'eglence-haberleri': 'bg-amber-600 text-white',
  'etkinlik-duyurulari': 'bg-primary text-[var(--bf-neon-on)]',
  'trend-hikayeler': 'bg-emerald-600 text-white'
};

export const FEED_TYPE_BADGE_COLORS: Partial<Record<FeedPostType, string>> = {
  concert_news: 'bg-rose-600 text-white',
  festival_news: 'bg-purple-600 text-white',
  music_news: 'bg-indigo-600 text-white',
  artist_news: 'bg-violet-600 text-white',
  entertainment_news: 'bg-amber-600 text-white',
  event_announcement: 'bg-sky-600 text-white',
  ticket_alert: 'bg-orange-600 text-white',
  trending_story: 'bg-emerald-600 text-white'
};

export const FEED_CATEGORY_BADGE_FALLBACK = 'bg-zinc-700 text-white';

export function feedBadgeClass(
  categorySlug: string | null,
  contentType: FeedPostType
): string {
  if (categorySlug && FEED_CATEGORY_BADGE_COLORS[categorySlug]) {
    return FEED_CATEGORY_BADGE_COLORS[categorySlug];
  }
  return FEED_TYPE_BADGE_COLORS[contentType] ?? FEED_CATEGORY_BADGE_FALLBACK;
}

export const DEFAULT_FEED_CATEGORIES = [
  {
    slug: 'konser-haberleri',
    name: 'Konser Haberleri',
    description: 'Konser duyuruları, turne haberleri ve sahne gündemi',
    sortOrder: 1
  },
  {
    slug: 'festival-haberleri',
    name: 'Festival Haberleri',
    description: 'Festival programları, line-up ve sahne deneyimleri',
    sortOrder: 2
  },
  {
    slug: 'muzik-haberleri',
    name: 'Müzik Haberleri',
    description: 'Müzik endüstrisi, albüm ve sanatçı gündemi',
    sortOrder: 3
  },
  {
    slug: 'eglence-haberleri',
    name: 'Eğlence Haberi',
    description: 'Genel eğlence ve kültür-sanat haberleri',
    sortOrder: 4
  },
  {
    slug: 'etkinlik-duyurulari',
    name: 'Etkinlik Duyuruları',
    description: 'Yeni etkinlikler ve bilet duyuruları',
    sortOrder: 5
  },
  {
    slug: 'trend-hikayeler',
    name: 'Trend Hikâyeler',
    description: 'Günün en çok konuşulan etkinlik hikâyeleri',
    sortOrder: 6
  }
] as const;

/** Kapak görseli eksik veya placeholder ise true döner (admin panelde uyarı / yayın engeli için) */
export function isMissingFeedCoverImage(coverImage: string | null | undefined): boolean {
  if (!coverImage || !coverImage.trim()) return true;
  const value = coverImage.trim();
  if (value.includes('brand/logo')) return true;
  if (value.includes('og-default')) return true;
  if (value === FEED_FALLBACK_COVER) return true;
  return false;
}

/** Yayın / öne çıkarma için gerçek kapak zorunlu — hata mesajı. */
export const FEED_COVER_REQUIRED_MESSAGE =
  'Kapak görseli eksik. Yayınlamak veya öne çıkarmak için gerçek bir kapak görseli ekleyin.';

export const FEED_DISCOVERY_SOURCES = [
  {
    name: 'BiletFeed Events RSS',
    url: 'internal://biletfeed/events',
    sourceType: 'internal'
  }
] as const;
