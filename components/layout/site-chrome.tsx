'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { MobileBottomNav } from '@/components/layout/mobile/mobile-bottom-nav';
import { MobileHeader } from '@/components/layout/mobile/mobile-header';
import { HomeCityBar } from '@/components/home/home-city-bar';
import { NewsletterBanner } from '@/components/layout/newsletter-banner';
import {
  mobileBottomNavClearanceClass,
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

  return (
    <div className="flex min-h-screen flex-col">
      <div className="md:hidden">
        <MobileHeader categories={categories} />
      </div>
      <div className="hidden md:block">
        <Header />
      </div>

      <HomeCityBar />

      <main
        className={cn(
          'flex-1',
          !hideBottomNav &&
            hideSiteFooter &&
            `${mobileBottomNavClearanceClass} md:pb-0`
        )}
      >
        {children}
      </main>

      {!hideBottomNav && (
        <div className="md:hidden">
          <MobileBottomNav />
        </div>
      )}

      {!hideSiteFooter && showNewsletter && <NewsletterBanner />}

      {!hideSiteFooter && (
        <>
          <div className="hidden md:block">{footer}</div>
          <div
            className={cn(
              'md:hidden',
              !hideBottomNav && mobileBottomNavClearanceClass
            )}
          >
            {mobileFooter}
          </div>
        </>
      )}
    </div>
  );
}
