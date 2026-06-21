'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { MobileBottomNav } from '@/components/layout/mobile/mobile-bottom-nav';
import { MobileHeader } from '@/components/layout/mobile/mobile-header';
import { shouldHideBottomNav } from '@/lib/layout/navigation';
import { cn } from '@/lib/utils';

interface SiteChromeProps {
  children: React.ReactNode;
  footer: React.ReactNode;
  mobileFooter: React.ReactNode;
}

export function SiteChrome({ children, footer, mobileFooter }: SiteChromeProps) {
  const pathname = usePathname();
  const hideBottomNav = shouldHideBottomNav(pathname);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="md:hidden">
        <MobileHeader />
      </div>
      <div className="hidden md:block">
        <Header />
      </div>

      <main
        className={cn(
          'flex-1',
          !hideBottomNav &&
            'pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0'
        )}
      >
        {children}
      </main>

      {!hideBottomNav && (
        <div className="md:hidden">
          <MobileBottomNav />
        </div>
      )}

      <div className="hidden md:block">{footer}</div>
      <div className="md:hidden">{mobileFooter}</div>
    </div>
  );
}
