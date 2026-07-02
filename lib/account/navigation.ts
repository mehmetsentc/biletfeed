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

export const accountMenuGroups: AccountMenuGroup[] = [
  {
    items: [
      {
        href: '/profil',
        label: 'Profilim',
        icon: User,
        isActive: (p) => p === '/profil' || p === '/profil/duzenle'
      },
      {
        href: '/profil/bilgilerim',
        label: 'Bilgilerim',
        icon: Contact,
        isActive: (p) => p === '/profil/bilgilerim'
      },
      {
        href: '/profil/ayarlar',
        label: 'Ayarlar',
        icon: Settings,
        isActive: (p) =>
          p === '/profil/ayarlar' ||
          p === '/profil/email' ||
          p === '/profil/sifre' ||
          p === '/profil/ilgi-alanlari'
      },
      {
        href: '/bildirimler',
        label: 'Bildirimler',
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
        label: 'Biletlerim',
        icon: Ticket,
        isActive: (p) => p.startsWith('/biletlerim')
      },
      {
        href: '/favorilerim',
        label: 'Favorilerim',
        icon: Heart,
        isActive: (p) => p === '/favorilerim'
      },
      {
        href: '/degerlendirmelerim',
        label: 'Değerlendirmelerim',
        icon: Star,
        isActive: (p) => p === '/degerlendirmelerim'
      }
    ]
  }
];

export const accountYardimMenuItem: AccountMenuItem = {
  href: '/profil/destek',
  label: 'Yardım',
  icon: LifeBuoy,
  isActive: (p) =>
    p === '/profil/destek' || p === '/yardim' || p === '/iletisim' || p === '/sss'
};

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
