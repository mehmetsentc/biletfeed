'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Search, Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { useCity } from '@/components/providers/city-provider';
import { toCategoryNavLinks, type CategoryNavItem } from '@/lib/categories/nav-links';
import { corporateMobileLinks } from '@/lib/layout/corporate-links';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  categories: CategoryNavItem[];
}

export function MobileHeader({ categories }: MobileHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { citySlug, cities, openCityPicker } = useCity();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');

  const currentCity = cities.find((c) => c.slug === citySlug);
  const cityName = currentCity?.name ?? 'Şehir seç';

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/etkinlikler?q=${encodeURIComponent(q)}` : '/etkinlikler');
  }

  const menuLinks = toCategoryNavLinks(categories);

  return (
    <>
      <header
        className={cn(
          'glass-header sticky top-0 z-50 border-b pt-[env(safe-area-inset-top)] lg:hidden',
          'text-[var(--header-fg)]'
        )}
      >
        {/* Üst bar — logo ortada, kompakt header */}
        <div className="relative flex h-12 items-center justify-center px-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="absolute left-3 flex size-11 items-center justify-center text-primary"
            aria-label="Menü"
          >
            <Menu className="size-6" strokeWidth={2.5} />
          </button>

          <Logo variant="auto" className="pointer-events-auto" />

          <button
            type="button"
            onClick={() => {
              const input = document.getElementById('mobile-search-input');
              input?.focus();
            }}
            className="absolute right-3 flex size-9 items-center justify-center text-[var(--header-fg)]"
            aria-label="Ara"
          >
            <Search className="size-5" />
          </button>
        </div>

        {/* Şehir + arama */}
        <div className="flex items-center gap-2 border-t border-[var(--header-border)] px-3 py-2">
          <button
            type="button"
            onClick={openCityPicker}
            className="flex shrink-0 items-center gap-1 rounded-full border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
            aria-label="Şehir seç"
          >
            <MapPin className="size-3.5 shrink-0" />
            <span className="max-w-[80px] truncate">{cityName}</span>
          </button>

          <form onSubmit={handleSearch} className="flex flex-1">
            <div className="relative flex flex-1 items-center">
              <Search
                className="pointer-events-none absolute left-3 size-4 text-[var(--header-fg-muted)]"
                aria-hidden
              />
              <input
                id="mobile-search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Etkinlik, mekan, sanatçı ara…"
                className={cn(
                  'h-9 w-full rounded-full border border-[var(--header-border)] pl-9 pr-3 text-sm outline-none',
                  'bg-[var(--muted)] text-[var(--foreground)] placeholder:text-[var(--header-fg-muted)]',
                  'focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
                )}
              />
            </div>
          </form>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            className={cn(
              'absolute inset-y-0 left-0 w-[75vw] max-w-xs overflow-y-auto',
              'border-r border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]'
            )}
          >
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
              <Logo variant="auto" href="/" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]"
              >
                <X className="size-4" />
              </button>
            </div>

            {!user && (
              <div className="flex gap-2 px-5 pb-5">
                <Link
                  href="/giris"
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-lg border border-[var(--border)] py-2.5 text-sm font-semibold"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/kayit"
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground"
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
                  className="flex items-center gap-3 rounded-xl bg-[var(--muted)] px-4 py-3"
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
                    <p className="text-sm font-semibold">{user.displayName ?? 'Profil'}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{user.email}</p>
                  </div>
                </Link>
              </div>
            )}

            <div className="px-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                Keşfet
              </p>
              <div className="space-y-0.5">
                <Link
                  href="/feed"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center rounded-lg px-3 py-3 text-sm font-semibold text-primary"
                >
                  BiletFeed Feed
                </Link>
                <Link
                  href="/etkinlikler"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-[var(--muted)] hover:text-primary"
                >
                  Tüm Etkinlikler
                </Link>
              </div>
            </div>

            <div className="mt-6 px-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                Kategoriler
              </p>
              <div className="space-y-0.5">
                {menuLinks.map((link) => (
                  <Link
                    key={link.slug}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-[var(--muted)] hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/kategoriler"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 flex items-center rounded-lg px-3 py-3 text-sm font-semibold text-primary"
                >
                  Tüm Kategoriler →
                </Link>
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--border)] px-5 pt-5 pb-8">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                Kurumsal
              </p>
              {corporateMobileLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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
