/** Ham aggregator / arama sonuç sayfaları — kaynak etiketi olarak gösterme. */
const GENERIC_SOURCE_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'news.google.com',
  'bing.com',
  'www.bing.com',
  'duckduckgo.com',
  't.co',
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'twitter.com',
  'x.com',
  'news.yahoo.com',
  'amp.gs'
]);

const KNOWN_SOURCE_LABELS: Record<string, string> = {
  'hurriyet.com.tr': 'Hürriyet',
  'milliyet.com.tr': 'Milliyet',
  'sabah.com.tr': 'Sabah',
  'ntv.com.tr': 'NTV',
  'pitchfork.com': 'Pitchfork',
  'rollingstone.com': 'Rolling Stone',
  'nme.com': 'NME',
  'billboard.com': 'Billboard',
  'cumhuriyet.com.tr': 'Cumhuriyet',
  'haberturk.com': 'Haberturk',
  'biletfeed.com': 'BiletFeed'
};

function hostnameFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

function looksLikeRawHost(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v) return false;
  if (GENERIC_SOURCE_HOSTS.has(v) || GENERIC_SOURCE_HOSTS.has(`www.${v}`)) return true;
  // google.com, news.google.com, vb.
  return /^[\w.-]+\.(com|net|org|tr|io)(\.[a-z]{2})?$/i.test(v) && !KNOWN_SOURCE_LABELS[v];
}

function prettyHostLabel(host: string): string {
  return KNOWN_SOURCE_LABELS[host] ?? host;
}

/**
 * Kaynak satırı için temiz etiket.
 * - `google.com` / aggregator ham host’larını gizler veya sourceUrl’den gerçek domain çıkarır
 * - Bilinen yayınları okunabilir isme çevirir
 */
export function formatFeedSourceLabel(input: {
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceAttribution?: string | null;
}): { label: string | null; href: string | null } {
  const href = input.sourceUrl?.trim() || null;
  const hostFromUrl = href ? hostnameFromUrl(href) : null;
  const rawName = (input.sourceName ?? '').trim();

  // Attribution içinde "Kaynak: google.com" gibi ham metin varsa yeniden üret
  let label: string | null = null;

  if (rawName) {
    const nameHost = rawName.toLowerCase().replace(/^www\./, '');
    if (GENERIC_SOURCE_HOSTS.has(nameHost) || GENERIC_SOURCE_HOSTS.has(`www.${nameHost}`)) {
      label = hostFromUrl && !GENERIC_SOURCE_HOSTS.has(hostFromUrl) ? prettyHostLabel(hostFromUrl) : null;
    } else if (looksLikeRawHost(rawName) && hostFromUrl && hostFromUrl !== nameHost) {
      label = prettyHostLabel(hostFromUrl);
    } else if (looksLikeRawHost(rawName)) {
      label = KNOWN_SOURCE_LABELS[nameHost] ?? (GENERIC_SOURCE_HOSTS.has(nameHost) ? null : prettyHostLabel(nameHost));
    } else {
      label = rawName;
    }
  } else if (hostFromUrl && !GENERIC_SOURCE_HOSTS.has(hostFromUrl)) {
    label = prettyHostLabel(hostFromUrl);
  }

  if (!label && input.sourceAttribution) {
    const cleaned = input.sourceAttribution.replace(/^kaynak:\s*/i, '').trim();
    const cleanedHost = cleaned.toLowerCase().replace(/^www\./, '');
    if (cleaned && !GENERIC_SOURCE_HOSTS.has(cleanedHost) && cleanedHost !== 'google.com') {
      label = looksLikeRawHost(cleaned) ? prettyHostLabel(cleanedHost) : cleaned;
    }
  }

  // Aggregator URL’lerini gizle — kullanıcıyı Google News vb. gönderme
  const safeHref =
    label && href && hostFromUrl && !GENERIC_SOURCE_HOSTS.has(hostFromUrl) ? href : null;

  return { label, href: safeHref };
}
