'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Search, Menu, X } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useCity } from '@/components/providers/city-provider';
import { useState } from 'react';

export function MobileHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const { citySlug, cities, setCity } = useCity();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');

  const currentCity = cities.find((c) => c.slug === citySlug);
  const cityName = currentCity?.name ?? 'Şehir seç';

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/etkinlikler?q=${encodeURIComponent(q)}` : '/etkinlikler');
  }

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
      {/* Header — light */}
      <header
        className="sticky top-0 z-50 lg:hidden bg-white"
        style={{ borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <div className="flex h-14 items-center gap-2 px-3">
          {/* City pill */}
          <button
            onClick={() => {
              const next = cities[(cities.findIndex(c => c.slug === citySlug) + 1) % cities.length];
              if (next) setCity(next.slug);
            }}
            className="flex shrink-0 items-center gap-1 rounded-full border border-primary/40 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary"
          >
            <MapPin className="size-3.5 shrink-0" />
            <span className="max-w-[80px] truncate">{cityName}</span>
          </button>

          {/* Real search input */}
          <form onSubmit={handleSearch} className="flex flex-1">
            <div className="relative flex flex-1 items-center">
              <Search className="pointer-events-none absolute left-3 size-4 text-gray-400" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Etkinlik, mekan, sanatçı ara…"
                className="h-9 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </form>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {/* Side Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="absolute inset-y-0 left-0 w-[75vw] max-w-xs overflow-y-auto bg-white"
            style={{ borderRight: '1px solid #e5e7eb' }}
          >
            {/* Logo + close */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
              <span className="text-xl font-extrabold tracking-tight text-gray-900">
                bilet<span className="text-primary">feed</span>
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-gray-100 text-gray-500"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Auth */}
            {!user && (
              <div className="flex gap-2 px-5 pb-5">
                <Link
                  href="/giris"
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-700"
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
                  className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3"
                >
                  {user.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photoURL} alt="" className="size-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {user.displayName?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.displayName ?? 'Profil'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </Link>
              </div>
            )}

            {/* Categories */}
            <div className="px-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Kategoriler
              </p>
              <div className="space-y-0.5">
                {menuLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center rounded-lg px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Corporate */}
            <div className="mt-6 border-t border-gray-100 px-5 pt-5 pb-8">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
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
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:text-gray-800"
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
