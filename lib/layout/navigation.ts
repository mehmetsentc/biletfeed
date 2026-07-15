/** Mobil alt navigasyon yüksekliği + safe area — sabit nav altında içerik kalmaması için */
export const mobileBottomNavClearanceClass =
  'pb-[calc(4.75rem+env(safe-area-inset-bottom))]';

/** Sabit alt barların (bilet CTA vb.) nav üstüne oturması için */
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

/** Footer ve bülten şeridinin gizleneceği hesap / profil rotaları */
export const hideSiteFooterPrefixes = [
  '/profil',
  '/biletlerim',
  '/favorilerim',
  '/degerlendirmelerim',
  '/destek',
  '/bildirimler'
];

export function shouldHideBottomNav(pathname: string): boolean {
  return hideBottomNavPrefixes.some(
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
