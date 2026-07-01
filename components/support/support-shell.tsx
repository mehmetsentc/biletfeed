import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { getSiteUrl, supportHref } from '@/lib/config/domain';
import { siteConfig } from '@/lib/config/site';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Ana Sayfa', href: supportHref('/') },
  { label: 'Bilgi tabanı', href: supportHref('/#bilgi-tabani') },
  { label: 'Destek talebi', href: supportHref('/destek-talebi') }
] as const;

export function SupportHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo href={supportHref('/')} variant="on-light" />
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors',
                'hover:bg-amber-50 hover:text-[#f5a623]'
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={getSiteUrl('/giris')}
            className="ml-2 rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Giriş Yap
          </Link>
        </nav>
        <Link
          href={getSiteUrl('/giris')}
          className="rounded-lg bg-[#f5a623] px-3 py-2 text-sm font-semibold text-white md:hidden"
        >
          Giriş
        </Link>
      </div>
    </header>
  );
}

export function SupportFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} {siteConfig.name} — Destek Merkezi
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href={getSiteUrl('/')}
            className="text-zinc-600 hover:text-[#f5a623]"
          >
            biletfeed.com
          </Link>
          <Link
            href={getSiteUrl('/gizlilik')}
            className="text-zinc-600 hover:text-[#f5a623]"
          >
            Gizlilik
          </Link>
          <Link
            href={getSiteUrl('/kosullar')}
            className="text-zinc-600 hover:text-[#f5a623]"
          >
            Kullanım Koşulları
          </Link>
        </div>
      </div>
    </footer>
  );
}
