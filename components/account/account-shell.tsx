'use client';

import { usePathname } from 'next/navigation';
import { AccountSidebar } from '@/components/account/account-sidebar';
import { cn } from '@/lib/utils';

function usesProfileTabs(pathname: string): boolean {
  return (
    pathname === '/profil' ||
    pathname === '/profil/bilgilerim' ||
    pathname === '/profil/ayarlar' ||
    pathname.startsWith('/biletlerim') ||
    pathname === '/favorilerim' ||
    pathname === '/degerlendirmelerim' ||
    pathname === '/profil/destek'
  );
}

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabLayout = usesProfileTabs(pathname);

  if (tabLayout) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-8 lg:py-10">
        <main
          className={cn(
            'mx-auto min-w-0 rounded-2xl border border-border bg-card p-5 md:p-8',
            pathname === '/profil/bilgilerim' ||
              pathname === '/profil/ayarlar' ||
              pathname === '/degerlendirmelerim' ||
              pathname === '/profil/destek' ||
              pathname === '/favorilerim' ||
              pathname.startsWith('/biletlerim')
              ? 'max-w-6xl'
              : 'max-w-5xl'
          )}
        >
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="container mx-auto grid gap-6 px-4 py-6 md:gap-8 md:py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-10">
      <AccountSidebar />
      <main className="min-w-0">
        <div className="rounded-2xl border border-border bg-card p-5 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
