/** Alt navigasyonun gizleneceği rotalar */
export const hideBottomNavPrefixes = [
  '/giris',
  '/kayit',
  '/odeme',
  '/dashboard',
  '/eventjoy',
  '/profil/ilgi-alanlari'
];

export function shouldHideBottomNav(pathname: string): boolean {
  return hideBottomNavPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export const mainNavLinks = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/etkinlikler', label: 'Etkinlikler' },
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/iletisim', label: 'İletişim' }
] as const;
