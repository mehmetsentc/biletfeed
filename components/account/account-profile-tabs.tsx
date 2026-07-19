'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Contact,
  Heart,
  Settings,
  Star,
  Ticket,
  User
} from 'lucide-react';
import { isEventJoyEnabled } from '@/lib/config/features';
import { useTranslations } from '@/components/providers';
import { cn } from '@/lib/utils';
import type { TranslationKeys } from '@/lib/i18n';

function getProfileTabs(t: TranslationKeys) {
  return [
    {
      href: '/profil',
      label: t.account.profile,
      icon: User,
      isActive: (p: string) => p === '/profil' || p === '/profil/duzenle'
    },
    {
      href: '/profil/ayarlar',
      label: t.account.settings,
      icon: Settings,
      isActive: (p: string) =>
        p === '/profil/ayarlar' ||
        p === '/profil/email' ||
        p === '/profil/sifre' ||
        p === '/profil/ilgi-alanlari'
    },
    {
      href: '/profil/bilgilerim',
      label: t.account.personalInfo,
      icon: Contact,
      isActive: (p: string) => p === '/profil/bilgilerim'
    },
    {
      href: '/biletlerim',
      label: t.account.myTickets,
      icon: Ticket,
      isActive: (p: string) => p.startsWith('/biletlerim')
    },
    {
      href: '/favorilerim',
      label: t.account.favorites,
      icon: Heart,
      isActive: (p: string) => p === '/favorilerim'
    },
    {
      href: '/degerlendirmelerim',
      label: t.account.reviews,
      icon: Star,
      isActive: (p: string) => p === '/degerlendirmelerim'
    },
    {
      href: '/eventjoy/panel',
      label: 'Event Joy',
      icon: Calendar,
      userOnly: true,
      hideOnPaths: ['/profil/bilgilerim', '/organizator-panel'],
      isActive: (p: string) => p.startsWith('/eventjoy')
    }
  ] as const;
}

export function AccountProfileTabs() {
  const t = useTranslations();
  const pathname = usePathname();
  const profileTabs = getProfileTabs(t);

  const visibleTabs = profileTabs.filter((tab) => {
    if (tab.href.startsWith('/eventjoy') && !isEventJoyEnabled) return false;
    if (
      'hideOnPaths' in tab &&
      tab.hideOnPaths?.some((prefix) => pathname.startsWith(prefix))
    ) {
      return false;
    }
    return true;
  });

  return (
    <nav
      aria-label="Hesap sekmeleri"
      className="-mx-5 mb-8 border-b border-border px-2 md:-mx-8 md:px-4"
    >
      <div className="flex gap-1 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleTabs.map((tab) => {
          const active = tab.isActive(pathname);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4',
                active
                  ? 'border-primary text-[var(--bf-accent-ink)]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
