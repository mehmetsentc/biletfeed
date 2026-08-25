/** Mobil alt navigasyon yüksekliği + safe area — fixed overlay / eski clearance için */
export const mobileBottomNavClearanceClass =
  'pb-[calc(4.75rem+env(safe-area-inset-bottom))]';

/**
 * Site responsive şeritleri (Tailwind):
 * - Telefon: 0–767 (md altı) — MobileHeader + bottom nav
 * - Tablet: 768–1279 (md–xl) — kompakt Header, tablet hero/CTA
 * - Masaüstü: 1280+ (xl) — tam nav + yan paneller
 */

/** Viewport’a fixed barların (bilet CTA vb.) alt nav üstüne oturması için */
export const mobileBottomNavOffsetClass =
  'bottom-[calc(4.75rem+env(safe-area-inset-bottom))]';

/** Alt navigasyonun gizleneceği rotalar */
export const hideBottomNavPrefixes = [
  '/giris',
  '/kayit',
  '/odeme',
  '/organizator-panel',
  '/eventjoy',
  '/profil/ilgi-alanlari',
  '/etkinlik'
];

/** Site header / chrome’un tamamen gizleneceği rotalar (odaklanmış akış) */
export const hideSiteHeaderPrefixes = ['/odeme'];

/** Footer ve bülten şeridinin gizleneceği hesap / profil rotaları */
export const hideSiteFooterPrefixes = [
  '/profil',
  '/biletlerim',
  '/favorilerim',
  '/degerlendirmelerim',
  '/destek',
  '/bildirimler',
  '/odeme'
];

export function shouldHideBottomNav(pathname: string): boolean {
  return hideBottomNavPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function shouldHideSiteHeader(pathname: string): boolean {
  return hideSiteHeaderPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function shouldHideSiteFooter(pathname: string): boolean {
  return hideSiteFooterPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function shouldShowNewsletterBanner(pathname: string): boolean {
  return pathname === '/';
}

/** `/feed/[slug]` okuma modu — şehir seçici / arama şeridini sadeleştir. */
export function isFeedArticlePath(pathname: string): boolean {
  return /^\/feed\/[^/]+\/?$/.test(pathname);
}

export function getMainNavLinks(t: {
  chrome: {
    home: string;
    feed: string;
    events: string;
    categories: string;
    about: string;
    contact: string;
  };
}) {
  return [
    { href: '/', label: t.chrome.home },
    { href: '/feed', label: t.chrome.feed },
    { href: '/etkinlikler', label: t.chrome.events },
    { href: '/kategoriler', label: t.chrome.categories },
    { href: '/hakkimizda', label: t.chrome.about },
    { href: '/iletisim', label: t.chrome.contact }
  ] as const;
}

/** @deprecated Use getMainNavLinks(t) — kept for non-i18n callers during migration */
export const mainNavLinks = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/feed', label: 'Feed' },
  { href: '/etkinlikler', label: 'Etkinlikler' },
  { href: '/kategoriler', label: 'Kategoriler' },
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/iletisim', label: 'İletişim' }
] as const;
