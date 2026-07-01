/** Mobil menü / footer — kurumsal sayfa linkleri (tek kaynak) */
export const corporateMobileLinks = [
  { label: 'Hakkımızda', href: '/hakkimizda' },
  { label: 'İletişim', href: '/iletisim' },
  { label: 'Gizlilik', href: '/gizlilik' },
  { label: 'Kullanım Koşulları', href: '/kosullar' }
] as const;

/** Eski / yanlış URL'ler → doğru sayfalar (next.config redirects) */
export const corporateLegacyRedirects = [
  { source: '/gizlilik-politikasi', destination: '/gizlilik' },
  { source: '/kullanim-kosullari', destination: '/kosullar' },
  { source: '/privacy', destination: '/gizlilik' },
  { source: '/terms', destination: '/kosullar' }
] as const;
