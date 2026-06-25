'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MapPin, Search, Menu, X } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useCity } from '@/components/providers/city-provider';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { citySlug, cities, setCity } = useCity();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentCity = cities.find((c) => c.slug === citySlug);
  const cityName = currentCity?.name ?? 'Şehir seç';

  const menuLinks = [
    { label: 'Konser', href: '/kategoriler/muzik' },
    { label: 'Tiyatro', href: '/kategoriler/tiyatro' },
    { label: 'Festival', href: '/kategoriler/festival' },
    { label: 'Stand Up', href: '/kategoriler/komedi' },
    { label: 'Çocuk', href: '/kategoriler/cocuk' },
    { label: 'Spor', href: '/kategoriler/spor' },
    { label: 'Sanat', href: '/kategoriler/sanat' },
  ];

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 lg:hidden" style={{ background: 'linear-gradient(135deg, #1a1d23 0%, #0c1017 100%)' }}>
        {/* Top bar */}
        <div className="flex h-14 items-center gap-2 px-3">
          {/* City selector */}
          <button
            onClick={() => {
              const next = cities[(cities.findIndex(c => c.slug === citySlug) + 1) % cities.length];
              if (next) setCity(next.slug);
            }}
            className="flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
          >
            <MapPin className="size-3.5 shrink-0" />
            <span className="max-w-[80px] truncate">{cityName}</span>
          </button>

          {/* Search bar */}
          <button
            onClick={() => router.push('/etkinlikler')}
            className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-left text-sm text-white/40"
          >
            <Search className="size-4 shrink-0 text-white/30" />
            <span>Etkinlik, mekan, sanatçı ara…</span>
          </button>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/70"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {/* Side Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div className="absolute inset-y-0 left-0 w-[75vw] max-w-xs overflow-y-auto"
            style={{ background: '#0c1017', borderRight: '1px solid rgba(245,166,35,0.12)' }}>

            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
              <span className="text-xl font-extrabold tracking-tight text-white">
                bilet<span className="text-primary">feed</span>
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-white/8 text-white/60"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Auth buttons */}
            {!user && (
              <div className="flex gap-2 px-5 pb-5">
                <Link
                  href="/giris"
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-lg border border-white/15 py-2.5 text-sm font-semibold text-white"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/kayit"
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-black"
                >
                  Üye Ol
                </Link>
              </div>
            )}

            {user && (
              <div className="px-5 pb-5">
                <Link
                  href="/profil"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-white/6 px-4 py-3"
                >
                  {user.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photoURL} alt="" className="size-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                      {user.displayName?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{user.displayName ?? 'Profil'}</p>
                    <p className="text-xs text-white/40">{user.email}</p>
                  </div>
                </Link>
              </div>
            )}

            {/* Category links */}
            <div className="px-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                Kategoriler
              </p>
              <div className="space-y-0.5">
                {menuLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center rounded-lg px-3 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/6 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom links */}
            <div className="mt-6 border-t border-white/8 px-5 pt-5 pb-8">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                Kurumsal
              </p>
              {[
                { label: 'Hakkımızda', href: '/hakkimizda' },
                { label: 'İletişim', href: '/iletisim' },
                { label: 'Gizlilik', href: '/gizlilik-politikasi' },
                { label: 'Kullanım Koşulları', href: '/kullanim-kosullari' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm text-white/50 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
