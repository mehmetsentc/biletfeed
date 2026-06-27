import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  Home,
  MessageCircle,
  Plus,
  User
} from 'lucide-react';

/** EventJoy uygulama rotaları — tek kaynak */
export const eventJoyRoutes = {
  landing: '/eventjoy',
  panel: '/eventjoy/panel',
  events: '/eventjoy/etkinlikler',
  messages: '/eventjoy/mesajlar',
  profile: '/eventjoy/profil',
  profileEdit: '/eventjoy/profil/duzenle',
  profileNotifications: '/eventjoy/profil/bildirimler',
  create: '/eventjoy/yeni',
  settings: '/eventjoy/ayarlar',
  siteHome: '/',
  accountProfile: '/profil'
} as const;

export type EventJoyNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

export const eventJoyNavItems: EventJoyNavItem[] = [
  {
    href: eventJoyRoutes.panel,
    label: 'Ana Sayfa',
    icon: Home,
    match: (p) => p === eventJoyRoutes.panel
  },
  {
    href: eventJoyRoutes.events,
    label: 'Etkinlikler',
    icon: Calendar,
    match: (p) =>
      p === eventJoyRoutes.events ||
      p.startsWith('/eventjoy/etkinlik/') ||
      p.startsWith('/eventjoy/misafirler')
  },
  {
    href: eventJoyRoutes.messages,
    label: 'Mesajlar',
    icon: MessageCircle,
    match: (p) => p.startsWith('/eventjoy/mesajlar')
  },
  {
    href: eventJoyRoutes.profile,
    label: 'Profil',
    icon: User,
    match: (p) => p.startsWith('/eventjoy/profil')
  }
];

export const eventJoyCreateNav = {
  href: eventJoyRoutes.create,
  label: 'Oluştur',
  labelDesktop: 'Yeni Etkinlik',
  icon: Plus
} as const;

/** Alt sayfa — chip bar gizlenir, geri linki kullanılır */
export function isEventJoySubPage(pathname: string): boolean {
  if (pathname.startsWith(eventJoyRoutes.create)) return true;
  if (pathname.includes('/misafirler/')) return true;
  if (
    pathname.startsWith(`${eventJoyRoutes.messages}/`) &&
    pathname !== eventJoyRoutes.messages
  ) {
    return true;
  }
  if (pathname.includes('/profil/') && pathname !== eventJoyRoutes.profile) {
    return true;
  }
  if (pathname.match(/\/etkinlik\/[^/]+\/(gorevler|butce)/)) return true;
  return false;
}

/** SEO / sayfa içi çapraz bağlantılar */
export const eventJoyCrossLinks = [
  { href: eventJoyRoutes.panel, label: 'EventJoy Panel' },
  { href: eventJoyRoutes.events, label: 'Etkinliklerim' },
  { href: eventJoyRoutes.messages, label: 'Mesajlar' },
  { href: eventJoyRoutes.profile, label: 'Profil' },
  { href: eventJoyRoutes.landing, label: 'EventJoy Tanıtım' },
  { href: eventJoyRoutes.siteHome, label: 'BiletFeed Ana Sayfa' }
] as const;
