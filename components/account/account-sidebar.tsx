'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  Ticket,
  Heart,
  Bell,
  Mail,
  KeyRound,
  Calendar,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navItems = [
  { href: '/profil', icon: User, label: 'Hesap Ayarları' },
  { href: '/biletlerim', icon: Ticket, label: 'Biletlerim' },
  { href: '/favorilerim', icon: Heart, label: 'Favorilerim' },
  { href: '/bildirimler', icon: Bell, label: 'Bildirimler' },
  { href: '/profil/email', icon: Mail, label: 'E-posta Değiştir' },
  { href: '/profil/sifre', icon: KeyRound, label: 'Şifre Değiştir' },
  { href: '/eventjoy/panel', icon: Calendar, label: 'EventJoy Panel' }
];

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const displayName = user?.displayName || 'Misafir Kullanıcı';
  const email = user?.email || 'demo@biletfeed.com';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
        <Avatar className="size-12">
          <AvatarFallback className="bg-primary/10 font-semibold text-primary">
            {initials || 'BF'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold">{displayName}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/profil' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push('/');
            router.refresh();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="size-4" strokeWidth={1.75} />
          Çıkış Yap
        </button>
      </nav>
    </aside>
  );
}
