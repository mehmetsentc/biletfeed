import type { EventType } from '@prisma/client';
import { mergeDateWithTimeText, parseScraperDateTime } from '@/lib/scraper/dates';

const CITY_ALIASES: Record<string, string> = {
  // Büyükşehirler
  istanbul: 'istanbul', İstanbul: 'istanbul',
  ankara: 'ankara', Ankara: 'ankara',
  izmir: 'izmir', İzmir: 'izmir',
  antalya: 'antalya', Antalya: 'antalya',
  bursa: 'bursa', Bursa: 'bursa',
  eskisehir: 'eskisehir', eskişehir: 'eskisehir', Eskişehir: 'eskisehir',
  // Diğer iller (Türkçe → ASCII slug)
  adana: 'adana', Adana: 'adana',
  adiyaman: 'adiyaman', adıyaman: 'adiyaman', Adıyaman: 'adiyaman',
  afyon: 'afyon', Afyon: 'afyon', afyonkarahisar: 'afyon', Afyonkarahisar: 'afyon',
  agri: 'agri', ağrı: 'agri', Ağrı: 'agri',
  aksaray: 'aksaray', Aksaray: 'aksaray',
  amasya: 'amasya', Amasya: 'amasya',
  ardahan: 'ardahan', Ardahan: 'ardahan',
  artvin: 'artvin', Artvin: 'artvin',
  aydin: 'aydin', aydın: 'aydin', Aydın: 'aydin',
  balikesir: 'balikesir', balıkesir: 'balikesir', Balıkesir: 'balikesir',
  bartin: 'bartin', bartın: 'bartin', Bartın: 'bartin',
  batman: 'batman', Batman: 'batman',
  bayburt: 'bayburt', Bayburt: 'bayburt',
  bilecik: 'bilecik', Bilecik: 'bilecik',
  bingol: 'bingol', bingöl: 'bingol', Bingöl: 'bingol',
  bitlis: 'bitlis', Bitlis: 'bitlis',
  bolu: 'bolu', Bolu: 'bolu',
  burdur: 'burdur', Burdur: 'burdur',
  canakkale: 'canakkale', çanakkale: 'canakkale', Çanakkale: 'canakkale',
  cankiri: 'cankiri', çankırı: 'cankiri', Çankırı: 'cankiri',
  corum: 'corum', çorum: 'corum', Çorum: 'corum',
  denizli: 'denizli', Denizli: 'denizli',
  diyarbakir: 'diyarbakir', diyarbakır: 'diyarbakir', Diyarbakır: 'diyarbakir',
  duzce: 'duzce', düzce: 'duzce', Düzce: 'duzce',
  edirne: 'edirne', Edirne: 'edirne',
  elazig: 'elazig', elazığ: 'elazig', Elazığ: 'elazig',
  erzincan: 'erzincan', Erzincan: 'erzincan',
  erzurum: 'erzurum', Erzurum: 'erzurum',
  gaziantep: 'gaziantep', Gaziantep: 'gaziantep',
  giresun: 'giresun', Giresun: 'giresun',
  gumushane: 'gumushane', gümüşhane: 'gumushane', Gümüşhane: 'gumushane',
  hakkari: 'hakkari', Hakkari: 'hakkari',
  hatay: 'hatay', Hatay: 'hatay',
  igdir: 'igdir', ığdır: 'igdir', Iğdır: 'igdir',
  isparta: 'isparta', Isparta: 'isparta',
  kahramanmaras: 'kahramanmaras', kahramanmaraş: 'kahramanmaras', Kahramanmaraş: 'kahramanmaras',
  karabuk: 'karabuk', karabük: 'karabuk', Karabük: 'karabuk',
  karaman: 'karaman', Karaman: 'karaman',
  kars: 'kars', Kars: 'kars',
  kastamonu: 'kastamonu', Kastamonu: 'kastamonu',
  kayseri: 'kayseri', Kayseri: 'kayseri',
  kilis: 'kilis', Kilis: 'kilis',
  kirikkale: 'kirikkale', kırıkkale: 'kirikkale', Kırıkkale: 'kirikkale',
  kirklareli: 'kirklareli', kırklareli: 'kirklareli', Kırklareli: 'kirklareli',
  kirsehir: 'kirsehir', kırşehir: 'kirsehir', Kırşehir: 'kirsehir',
  kocaeli: 'kocaeli', Kocaeli: 'kocaeli', izmit: 'kocaeli', İzmit: 'kocaeli',
  konya: 'konya', Konya: 'konya',
  kutahya: 'kutahya', kütahya: 'kutahya', Kütahya: 'kutahya',
  malatya: 'malatya', Malatya: 'malatya',
  manisa: 'manisa', Manisa: 'manisa',
  mardin: 'mardin', Mardin: 'mardin',
  mersin: 'mersin', Mersin: 'mersin', 'icel': 'mersin', İçel: 'mersin',
  mugla: 'mugla', muğla: 'mugla', Muğla: 'mugla',
  mus: 'mus', muş: 'mus', Muş: 'mus',
  nevsehir: 'nevsehir', nevşehir: 'nevsehir', Nevşehir: 'nevsehir',
  nigde: 'nigde', niğde: 'nigde', Niğde: 'nigde',
  ordu: 'ordu', Ordu: 'ordu',
  osmaniye: 'osmaniye', Osmaniye: 'osmaniye',
  rize: 'rize', Rize: 'rize',
  sakarya: 'sakarya', Sakarya: 'sakarya', adapazari: 'sakarya',
  samsun: 'samsun', Samsun: 'samsun',
  sanliurfa: 'sanliurfa', şanlıurfa: 'sanliurfa', Şanlıurfa: 'sanliurfa', urfa: 'sanliurfa',
  siirt: 'siirt', Siirt: 'siirt',
  sinop: 'sinop', Sinop: 'sinop',
  sirnak: 'sirnak', şırnak: 'sirnak', Şırnak: 'sirnak',
  sivas: 'sivas', Sivas: 'sivas',
  tekirdag: 'tekirdag', tekirdağ: 'tekirdag', Tekirdağ: 'tekirdag',
  tokat: 'tokat', Tokat: 'tokat',
  trabzon: 'trabzon', Trabzon: 'trabzon',
  tunceli: 'tunceli', Tunceli: 'tunceli',
  usak: 'usak', uşak: 'usak', Uşak: 'usak',
  van: 'van', Van: 'van',
  yalova: 'yalova', Yalova: 'yalova',
  yozgat: 'yozgat', Yozgat: 'yozgat',
  zonguldak: 'zonguldak', Zonguldak: 'zonguldak',
  // Popüler ilçe/bölge adları → il slug (Bubilet URL'si yanlış şehir kullanıyor)
  marmaris: 'mugla', Marmaris: 'mugla',
  bodrum: 'mugla', Bodrum: 'mugla',
  fethiye: 'mugla', Fethiye: 'mugla',
  datca: 'mugla', datça: 'mugla', Datça: 'mugla',
  gokova: 'mugla', gökova: 'mugla', Gökova: 'mugla',
  bozcaada: 'canakkale', Bozcaada: 'canakkale',
  trakya: 'edirne', Trakya: 'edirne',
  saros: 'edirne',   // Saros Körfezi → Edirne/Keşan
  arsuz: 'hatay', Arsuz: 'hatay',
  iskenderun: 'hatay', İskenderun: 'hatay',
  cesme: 'izmir', çeşme: 'izmir', Çeşme: 'izmir',
  alacati: 'izmir', alaçatı: 'izmir', Alaçatı: 'izmir',
  kusadasi: 'aydin', kuşadası: 'aydin', Kuşadası: 'aydin',
  didim: 'aydin', Didim: 'aydin',
  kapadokya: 'nevsehir', Kapadokya: 'nevsehir', cappadocia: 'nevsehir',
  pamukkale: 'denizli', Pamukkale: 'denizli',
  alanya: 'antalya', Alanya: 'antalya',
  manavgat: 'antalya', Manavgat: 'antalya',
  belek: 'antalya', Belek: 'antalya',
  kemer: 'antalya', Kemer: 'antalya',
  side: 'antalya', Side: 'antalya',
  safranbolu: 'karabuk', Safranbolu: 'karabuk',
  // Uluslararası şehirler (Bubilet yurt dışı etkinlikleri)
  kibris: 'kibris', kktc: 'kibris', 'kuzey kibris': 'kibris',
  baku: 'baku', bakü: 'baku', Bakü: 'baku', azerbaycan: 'baku',
  londra: 'londra', london: 'londra', London: 'londra',
  berlin: 'berlin', Berlin: 'berlin',
  stuttgart: 'stuttgart', Stuttgart: 'stuttgart',
  muenchen: 'muenchen', münchen: 'muenchen', munich: 'muenchen', Munich: 'muenchen',
  paris: 'paris', Paris: 'paris',
  dubai: 'dubai', Dubai: 'dubai',
  // Online
  online: 'online'
};

/**
 * Etkinlik başlığı veya mekan adından şehir slug'ı çıkarmaya çalışır.
 * Bubilet bazı etkinlikleri yanlış şehir URL'i altında listeler (ör. Trakya festivali
 * /antalya/ URL'i altında). Başlıktaki yer adı daha güvenilir bir kaynaktır.
 */
const TITLE_CITY_PATTERNS: Array<[RegExp, string]> = [
  // Trakya bölgesi
  [/\btrakya\b/i, 'edirne'],
  [/\bsaros körfezi\b|\bsaros\b/i, 'edirne'],
  // Çanakkale
  [/\bbozcaada\b/i, 'canakkale'],
  [/\bgökçeada\b|\bgokceada\b/i, 'canakkale'],
  // Muğla (ilçeler)
  [/\bmarmaris\b/i, 'mugla'],
  [/\bbodrum\b/i, 'mugla'],
  [/\bfethiye\b/i, 'mugla'],
  [/\bdatça\b|\bdatca\b/i, 'mugla'],
  [/\bgökova\b|\bgokova\b/i, 'mugla'],
  [/\byalıkavak\b|\byalikavak\b/i, 'mugla'],
  // İzmir
  [/\bçeşme\b|\bcesme\b/i, 'izmir'],
  [/\balacatı\b|\balaçatı\b|\balacati\b/i, 'izmir'],
  [/\bfoça\b|\bfoca\b/i, 'izmir'],
  [/\bseferihisar\b/i, 'izmir'],
  // Aydın
  [/\bkuşadası\b|\bkusadasi\b/i, 'aydin'],
  [/\bdidim\b/i, 'aydin'],
  // Hatay
  [/\barsuz\b/i, 'hatay'],
  [/\biskenderun\b/i, 'hatay'],
  [/\bantakya\b/i, 'hatay'],
  // Sinop
  [/\bsinop\b/i, 'sinop'],
  // Nevşehir
  [/\bkapadokya\b|\bkapadokia\b|\bcappadocia\b/i, 'nevsehir'],
  [/\bürgüp\b|\burgup\b|\bgoreme\b|\bgöreme\b/i, 'nevsehir'],
  // Denizli
  [/\bpamukkale\b/i, 'denizli'],
  // Antalya ilçeleri
  [/\balanya\b/i, 'antalya'],
  [/\bmanavgat\b|\bside\b|\bbelek\b/i, 'antalya'],
  // Sakarya
  [/\bsapanca\b/i, 'sakarya'],
  // Balıkesir
  [/\bayvalık\b|\bayvalik\b|\bbandırma\b|\bbandirma\b/i, 'balikesir'],
  // Bartın
  [/\bamasra\b/i, 'bartin'],
  // Karabük
  [/\bsafranbolu\b/i, 'karabuk'],
];

export function resolveCityFromTitle(text: string): string | null {
  for (const [pattern, slug] of TITLE_CITY_PATTERNS) {
    if (pattern.test(text)) return slug;
  }
  return null;
}

export function resolveCitySlug(input?: string | null): {
  slug: string;
  name: string;
} {
  if (!input?.trim()) {
    return { slug: 'istanbul', name: 'İstanbul' };
  }

  const key = input.trim().toLowerCase().replace(/ı/g, 'i');
  const slug =
    CITY_ALIASES[input.trim()] ||
    CITY_ALIASES[key] ||
    key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

  const name = input.trim();
  return { slug, name };
}

const CATEGORY_KEYWORDS: Array<{ slug: string; type: EventType; patterns: RegExp[] }> =
  [
    {
      slug: 'spor',
      type: 'sports',
      patterns: [
        /\bspor\b/i,
        /futbol/i,
        /football/i,
        /basketbol/i,
        /basketball/i,
        /\bfiba\b/i,
        /\bnba\b/i,
        /\buel\b/i,
        /şampiyonlar ligi/i,
        /maç\b/i,
        /voleybol/i,
        /tenis\b/i,
        /formula\s*1/i,
        /\bf1\b/i,
        /motogp/i,
        /güreş/i,
        /boks\b/i,
        /derbi/i,
        /galatasaray|fenerbahçe|beşiktaş|trabzonspor|başakşehir/i
      ]
    },
    {
      slug: 'party',
      type: 'other',
      patterns: [
        /\bparty\b/i,
        /\bparti\b/i,
        /\bklub\b/i,
        /\bclub night\b/i,
        /\bafter.?party\b/i,
        /\bnight.?club\b/i,
        /\bgece.?kulübü\b/i,
        /\bpool party\b/i,
        /\bpurple.?party\b/i,
        /\bfoam party\b/i,
        /\bcocktail party\b/i
      ]
    },
    {
      slug: 'muzik',
      type: 'concert',
      patterns: [
        /konser/i,
        /müzik(?!al)/i,
        /\bdj\b/i,
        /\brock\b/i,
        /\bpop\b/i,
        /akustik/i,
        /\btour\b/i,
        /\bconcert\b/i,
        /\bgala\b/i,
        /elektronik müzik/i,
        /rooftop series/i,
        /\ball night\b/i,
        /\blive\b.*müzik/i,
        // Türkçe müzik türleri
        /türkü/i,
        /\brap\b/i,
        /\bhip.?hop\b/i,
        /\br&b\b/i,
        /\bjazz\b/i,
        /\bbluegrass\b/i,
        /\bklasik müzik\b/i,
        /\borchestra\b/i,
        /\borkestr/i,
        /\bpiyano/i,
        /\bkeman\b/i,
        /\bvokal\b/i,
        /\bsolo gitar\b/i,
        // Konser bağlamı
        /şarkılarıyla/i,
        /şarkıları ile/i,
        /sahneye çıkacak/i,
        /sahnesinde/i,
        /seslendireck/i,
        /live music/i,
        /live performance/i,
        // Açıkhava = neredeyse her zaman konser mekanı
        /açıkhava/i,
        /open.?air/i,
        /amfi tiyatro.*müzik/i,
      ]
    },
    {
      slug: 'festival',
      type: 'festival',
      patterns: [
        /festival/i,
        /\bfest\b/i,
        /fuar/i,
        /\bfaire\b/i
      ]
    },
    {
      slug: 'tiyatro',
      type: 'theatre',
      patterns: [
        /tiyatro/i,
        /stand.?up/i,
        /müzikal/i,
        /\bopera\b/i,
        /\bbale\b/i,
        /\bpiyes\b/i,
        /\bmonolog\b/i,
        /\boyun\b.*sahne/i,
        /sahne.*\boyun\b/i,
        /\boyunu\b/i,
        /\bpremiere\b/i,
        /\bperformans\b/i,
        /\bimprov\b/i
      ]
    },
    {
      slug: 'komedi',
      type: 'theatre',
      patterns: [/komedi/i, /comedy/i, /güldürü/i]
    },
    {
      slug: 'cocuk',
      type: 'other',
      patterns: [
        /çocuk/i,
        /\bcocuk\b/i,
        /\bkids\b/i,
        /\baile\b/i,
        /family/i,
        /\bfrozen\b/i,
        /karlar ülkesi/i,
        /şirinler/i,
        /\bsmurfs\b/i,
        /paw patrol/i,
        /\bpeppa\b/i,
        /\bminecraft\b/i,
        /\bpokemon\b/i,
        /\bunicorn\b/i,
        /\bmasal\b/i,
        /çizgi film/i,
        /animasyon gösteri/i,
        /\bperi\b.*gösteri/i,
        /\bdinozor\b/i,
        /\bkral\b.*\bkız\b/i,
        /\bsüper kahraman/i
      ]
    },
    {
      slug: 'teknoloji',
      type: 'workshop',
      patterns: [/atölye/i, /eğitim/i, /seminer/i, /konferans/i, /workshop/i, /\btufting\b/i, /\btezhip\b/i, /vitray/i, /parfüm yapım/i, /\bmacrame\b/i]
    },
    {
      slug: 'online',
      type: 'online',
      patterns: [/online/i, /canlı yayın/i, /webinar/i]
    },
    {
      slug: 'sanat',
      type: 'other',
      patterns: [
        /sergi/i,
        /\bsanat\b/i,
        /\bmüze\b/i,
        /\bgaleri\b/i,
        /\bexhibition\b/i,
        /piramit/i,
        /keşfi/i,
        /\bantik\b/i,
        /\bkeşif\b/i,
        /\bcolosseum\b/i,
        /\bgezisi\b/i,
        /skywalk/i,
        /skyview/i,
        /\bpanorama\b/i
      ]
    },
    {
      slug: 'diger',
      type: 'other',
      patterns: [
        /aquapark/i,
        /\bhavuz\b/i,
        /hayvanat/i,
        /kahvaltı/i,
        /\bgünübirlik\b/i,
        /\bsafari\b/i,
        /\bbrunch\b/i,
        /\bdolphinarium\b/i,
        /yunus gösteri/i,
        /\bkampçılık\b/i,
        /\byüzme\b/i,
        /\bpiknik\b/i,
        /\bkayak\b.*\bturu\b/i,
        /\btur\b.*\bpaketi\b/i
      ]
    }
  ];

function matchCategoryInText(
  text: string
): { categorySlug: string; eventType: EventType } | null {
  const normalized = text.trim();
  if (!normalized) return null;

  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.patterns.some((p) => p.test(normalized))) {
      return { categorySlug: rule.slug, eventType: rule.type };
    }
  }

  return null;
}

export function mapCategory(
  title: string,
  description: string,
  hints?: string[]
): { categorySlug: string; eventType: EventType } {
  // Başlık her zaman öncelikli — platform ipuçları (ör. "tiyatro" genre slug) spor etkinliğini ezmesin
  const fromTitle = matchCategoryInText(title);
  if (fromTitle) return fromTitle;

  const fromDescription = matchCategoryInText(description);
  if (fromDescription) return fromDescription;

  for (const hint of hints || []) {
    const fromHint = matchCategoryInText(hint);
    if (fromHint) return fromHint;
  }

  return { categorySlug: 'diger', eventType: 'other' };
}

export function categorySlugToEventType(slug: string): EventType {
  return (
    CATEGORY_KEYWORDS.find((rule) => rule.slug === slug)?.type ?? 'other'
  );
}

export function parsePrice(text?: string | null): {
  price: number;
  isFree: boolean;
} {
  // No price text → fiyat bilinmiyor, ücretsiz değil
  if (!text) return { price: 0, isFree: false };
  const lower = text.toLowerCase();
  // Açıkça "ücretsiz" veya "0 TL" yazıyorsa ücretsiz
  if (/ücretsiz|free|0\s*₺|0\s*tl/i.test(lower)) {
    return { price: 0, isFree: true };
  }
  const match = text.replace(/\./g, '').match(/(\d[\d\s]*)/);
  const price = match ? parseInt(match[1].replace(/\s/g, ''), 10) : 0;
  // Sayı bulunamazsa yine bilinmiyor, ücretsiz değil
  return { price: Number.isFinite(price) && price > 0 ? price : 0, isFree: false };
}

export function parseTurkishDate(text?: string | null): Date | null {
  if (!text) return null;

  const parsed = parseScraperDateTime(text);
  if (parsed) return parsed;

  const timeMatch = text.match(/\b(\d{1,2}):(\d{2})\b/);

  const trMonths: Record<string, number> = {
    ocak: 0,
    şubat: 1,
    subat: 1,
    mart: 2,
    nisan: 3,
    mayıs: 4,
    mayis: 4,
    haziran: 5,
    temmuz: 6,
    ağustos: 7,
    agustos: 7,
    eylül: 8,
    eylul: 8,
    ekim: 9,
    kasım: 10,
    kasim: 10,
    aralık: 11,
    aralik: 11
  };

  const m = text
    .toLowerCase()
    .match(/(\d{1,2})[\s./-]+([a-zçğıöşü]+)(?:[\s./-]+(\d{4}))?/i);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = trMonths[m[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '')];
    const year = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
    if (month !== undefined) {
      const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const baseDate = parseScraperDateTime(isoDate, 20);
      if (!baseDate) return null;
      if (timeMatch) {
        return mergeDateWithTimeText(baseDate, timeMatch[0]) || baseDate;
      }
      return baseDate;
    }
  }

  return null;
}

export function extractNextData<T = unknown>(html: string): T | null {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
}

export async function fetchHtml(
  url: string,
  timeoutMs = 20000
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        Referer: new URL(url).origin + '/'
      },
      next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}
