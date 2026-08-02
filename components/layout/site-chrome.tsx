'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { MobileBottomNav } from '@/components/layout/mobile/mobile-bottom-nav';
import { MobileHeader } from '@/components/layout/mobile/mobile-header';
import { HomeCityBar } from '@/components/home/home-city-bar';
import { NewsletterBanner } from '@/components/layout/newsletter-banner';
import {
  shouldHideBottomNav,
  shouldHideSiteFooter,
  shouldShowNewsletterBanner
} from '@/lib/layout/navigation';
import type { CategoryNavItem } from '@/lib/categories/nav-links';
import { cn } from '@/lib/utils';

interface SiteChromeProps {
  children: React.ReactNode;
  footer: React.ReactNode;
  mobileFooter: React.ReactNode;
  categories: CategoryNavItem[];
}

export function SiteChrome({
  children,
  footer,
  mobileFooter,
  categories
}: SiteChromeProps) {
  const pathname = usePathname();
  const hideBottomNav = shouldHideBottomNav(pathname);
  const hideSiteFooter = shouldHideSiteFooter(pathname);
  const showNewsletter = shouldShowNewsletterBanner(pathname);
  /** Mobilde fixed alt nav iOS'ta scroll ile kayıyor — flex kabuk + iç scroll kullan */
  const mobileNavShell = !hideBottomNav;

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col',
        mobileNavShell && 'max-md:h-dvh max-md:overflow-hidden'
      )}
    >
      <div className="shrink-0 md:hidden">
        <MobileHeader categories={categories} />
      </div>
      <div className="hidden md:block">
        <Header />
      </div>

      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          mobileNavShell &&
            'max-md:overflow-y-auto max-md:overscroll-y-contain'
        )}
      >
        <HomeCityBar />

        <main className="flex-1">{children}</main>

        {!hideSiteFooter && showNewsletter && <NewsletterBanner />}

        {!hideSiteFooter && (
          <>
            <div className="hidden md:block">{footer}</div>
            <div className="md:hidden">{mobileFooter}</div>
          </>
        )}
      </div>

      {!hideBottomNav && (
        <div className="shrink-0 md:hidden">
          <MobileBottomNav />
        </div>
      )}
    </div>
  );
}
