import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { SupportHeaderAuth } from '@/components/support/support-header-auth';
import { verifySessionCookie } from '@/lib/auth/session';
import { supportHref } from '@/lib/config/domain';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Ana Sayfa', href: supportHref('/') },
  { label: 'Bilgi tabanı', href: supportHref('/#bilgi-tabani') },
  { label: 'Destek talebi', href: supportHref('/destek-talebi') }
] as const;

export async function SupportHeader() {
  const session = await verifySessionCookie();

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
                'hover:bg-[var(--bf-orange-surface)] hover:text-[var(--bf-accent-ink)]'
              )}
            >
              {item.label}
            </Link>
          ))}
          <SupportHeaderAuth
            className="ml-2"
            initialLoggedIn={Boolean(session)}
          />
        </nav>
        <SupportHeaderAuth
          className="md:hidden px-3 py-2"
          initialLoggedIn={Boolean(session)}
        />
      </div>
    </header>
  );
}
