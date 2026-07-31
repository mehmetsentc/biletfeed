/**
 * Feed keşif kaynakları — Tavily sorguları + RSS feed'ler
 */

export interface RssSource {
  name: string;
  url: string;
  lang: 'tr' | 'en';
  tags: string[];
}

export interface TavilyQuery {
  query: string;
  topic: 'news' | 'general';
  timeRange: 'day' | 'week';
}

/** Türkçe ve uluslararası müzik/etkinlik RSS feed'leri */
export const RSS_SOURCES: RssSource[] = [
  // Türkçe kaynaklar
  {
    name: 'Hürriyet Müzik',
    url: 'https://www.hurriyet.com.tr/rss/muzik',
    lang: 'tr',
    tags: ['konser', 'müzik', 'türkiye']
  },
  {
    name: 'Milliyet Magazin',
    url: 'https://www.milliyet.com.tr/rss/rssNew/magazinRss.xml',
    lang: 'tr',
    tags: ['magazin', 'sanatçı', 'türkiye']
  },
  {
    name: 'Sabah Müzik',
    url: 'https://www.sabah.com.tr/rss/muzik',
    lang: 'tr',
    tags: ['müzik', 'konser', 'türkiye']
  },
  {
    name: 'NTV Müzik',
    url: 'https://www.ntv.com.tr/rss/muzik',
    lang: 'tr',
    tags: ['müzik', 'etkinlik']
  },
  {
    name: 'Jazz Dergisi',
    url: 'https://www.jazzdergisi.com/feed',
    lang: 'tr',
    tags: ['konser', 'jazz', 'festival', 'röportaj']
  },
  {
    name: 'Extreminal',
    url: 'https://www.extreminal.com/tr/feed',
    lang: 'tr',
    tags: ['konser', 'metal', 'festival']
  },
  {
    name: 'Gecce Magazin',
    url: 'https://www.gecce.com.tr/rss.xml',
    lang: 'tr',
    tags: ['magazin', 'konser', 'sanatçı']
  },
  // Uluslararası kaynaklar
  {
    name: 'Pitchfork News',
    url: 'https://pitchfork.com/feed/feed-news/rss',
    lang: 'en',
    tags: ['konser', 'müzik', 'uluslararası']
  },
  {
    name: 'Rolling Stone Music',
    url: 'https://www.rollingstone.com/music/music-news/feed/',
    lang: 'en',
    tags: ['müzik', 'konser', 'sanatçı']
  },
  {
    name: 'NME Music',
    url: 'https://www.nme.com/news/music/feed',
    lang: 'en',
    tags: ['müzik', 'konser', 'festival']
  },
  {
    name: 'Billboard',
    url: 'https://www.billboard.com/feed/',
    lang: 'en',
    tags: ['müzik', 'chart', 'sanatçı']
  }
];

/**
 * Tavily'e günlük gönderilecek arama sorguları.
 * Her sorgu 1 kredi = 5 sorgu × 30 gün = ~150 kredi/ay (limit 1000)
 */
export const TAVILY_QUERIES: TavilyQuery[] = [
  {
    query: 'konser duyurusu Türkiye 2026 bilet',
    topic: 'news',
    timeRange: 'week'
  },
  {
    query: 'festival Türkiye yaz 2026 etkinlik',
    topic: 'news',
    timeRange: 'week'
  },
  {
    query: 'Bodrum Muğla Marmaris konser parti 2026',
    topic: 'news',
    timeRange: 'week'
  },
  {
    query: 'Turkey concert tour announcement 2026',
    topic: 'news',
    timeRange: 'week'
  },
  {
    query: 'müzik haberleri sanatçı albüm konser',
    topic: 'news',
    timeRange: 'day'
  },
  {
    // musicfestivalwizard.com'da RSS yok — Tavily site araması ile kapsıyoruz
    query: 'site:musicfestivalwizard.com festival lineup announcement 2026',
    topic: 'news',
    timeRange: 'week'
  },
  {
    // djmag.com robots.txt'i AI/scraper botlarını (ClaudeBot dahil) açıkça
    // yasaklıyor — siteyi doğrudan taramıyoruz, genel arama ile elektronik
    // müzik/DJ/parti gündemini yine de kapsıyoruz
    query: 'elektronik müzik DJ festival parti haberleri 2026',
    topic: 'news',
    timeRange: 'week'
  }
];
