/** Alt navigasyonun gizleneceği rotalar */
export const hideBottomNavPrefixes = [
  '/giris',
  '/kayit',
  '/odeme',
  '/dashboard',
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

export const mainNavLinks = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/feed', label: 'Feed' },
  { href: '/etkinlikler', label: 'Etkinlikler' },
  { href: '/kategoriler', label: 'Kategoriler' },
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/iletisim', label: 'İletişim' }
] as const;
