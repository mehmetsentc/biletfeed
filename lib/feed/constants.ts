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

export const FEED_CATEGORY_BADGE_FALLBACK = 'bg-primary text-[var(--bf-neon-on)]';

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

export const FEED_DISCOVERY_SOURCES = [
  {
    name: 'BiletFeed Events RSS',
    url: 'internal://biletfeed/events',
    sourceType: 'internal'
  }
] as const;
