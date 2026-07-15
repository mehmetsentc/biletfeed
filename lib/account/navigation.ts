import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Calendar,
  Contact,
  Heart,
  LifeBuoy,
  Settings,
  Star,
  Ticket,
  User
} from 'lucide-react';
import { isEventJoyEnabled } from '@/lib/config/features';
import type { TranslationKeys } from '@/lib/i18n';

export type AccountMenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive?: (pathname: string) => boolean;
  /** Sadece kullanıcı hesabında göster */
  userOnly?: boolean;
  /** Bu path öneklerinde menü öğesini gizle */
  hideOnPathPrefixes?: string[];
};

export type AccountMenuGroup = {
  items: AccountMenuItem[];
};

export function getAccountMenuGroups(t: TranslationKeys): AccountMenuGroup[] {
  return [
    {
      items: [
        {
          href: '/profil',
          label: t.account.profile,
          icon: User,
          isActive: (p) => p === '/profil' || p === '/profil/duzenle'
        },
        {
          href: '/profil/bilgilerim',
          label: t.account.personalInfo,
          icon: Contact,
          isActive: (p) => p === '/profil/bilgilerim'
        },
        {
          href: '/profil/ayarlar',
          label: t.account.settings,
          icon: Settings,
          isActive: (p) =>
            p === '/profil/ayarlar' ||
            p === '/profil/email' ||
            p === '/profil/sifre' ||
            p === '/profil/ilgi-alanlari'
        },
        {
          href: '/bildirimler',
          label: t.account.notifications,
          icon: Bell,
          isActive: (p) => p === '/bildirimler'
        }
      ]
    },
    ...(isEventJoyEnabled
      ? [
          {
            items: [
              {
                href: '/eventjoy/panel',
                label: 'Event Joy Panel',
                icon: Calendar,
                userOnly: true,
                hideOnPathPrefixes: ['/profil/bilgilerim', '/organizator-panel'],
                isActive: (p: string) => p.startsWith('/eventjoy')
              }
            ]
          } satisfies AccountMenuGroup
        ]
      : []),
    {
      items: [
        {
          href: '/biletlerim',
          label: t.account.myTickets,
          icon: Ticket,
          isActive: (p) => p.startsWith('/biletlerim')
        },
        {
          href: '/favorilerim',
          label: t.account.favorites,
          icon: Heart,
          isActive: (p) => p === '/favorilerim'
        },
        {
          href: '/degerlendirmelerim',
          label: t.account.reviews,
          icon: Star,
          isActive: (p) => p === '/degerlendirmelerim'
        }
      ]
    }
  ];
}

export function getAccountYardimMenuItem(t: TranslationKeys): AccountMenuItem {
  return {
    href: '/profil/destek',
    label: t.account.help,
    icon: LifeBuoy,
    isActive: (p) =>
      p === '/profil/destek' || p === '/yardim' || p === '/iletisim' || p === '/sss'
  };
}

export function isAccountAreaActive(pathname: string): boolean {
  return (
    pathname.startsWith('/profil') ||
    pathname.startsWith('/biletlerim') ||
    pathname === '/favorilerim' ||
    pathname === '/degerlendirmelerim' ||
    pathname === '/profil/destek' ||
    pathname === '/bildirimler' ||
    pathname.startsWith('/yardim') ||
    pathname.startsWith('/organizator-panel') ||
    (isEventJoyEnabled && pathname.startsWith('/eventjoy'))
  );
}
