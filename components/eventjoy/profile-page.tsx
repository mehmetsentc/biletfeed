'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { EventJoyCrossLinks } from '@/components/eventjoy/eventjoy-cross-links';
import { useAuth } from '@/components/providers/auth-provider';
import { useEventJoy } from '@/components/providers/eventjoy-provider';
import { eventJoyRoutes } from '@/lib/eventjoy/navigation';
import { profileDisplayName, profileInitials } from '@/lib/eventjoy/utils';

const menuItems = [
  { href: eventJoyRoutes.profileEdit, label: 'Profili Düzenle' },
  { href: eventJoyRoutes.profileNotifications, label: 'Bildirimler' },
  { href: '/sss', label: 'Sık Sorulan Sorular' },
  { href: '/iletisim', label: 'Bize Ulaşın' }
];

export function EventJoyProfilePage() {
  const { ready, profile } = useEventJoy();
  const { signOut } = useAuth();

  if (!ready) {
    return <div className="mx-auto max-w-xl animate-pulse px-4 py-6 h-64 rounded-xl bg-muted" />;
  }

  const name = profileDisplayName(profile);
  const initials = profileInitials(profile);
  const email = profile.email || 'E-posta ekleyin';

  return (
    <div className="max-w-xl space-y-6">
      <nav aria-label="Konum" className="text-sm text-muted-foreground">
        <Link href={eventJoyRoutes.panel} className="hover:text-[var(--bf-accent-ink)]">
          Ana Sayfa
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Profil</span>
      </nav>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href={eventJoyRoutes.events}
          className="rounded-lg border border-border bg-card px-3 py-1.5 font-medium hover:border-primary/40 hover:text-[var(--bf-accent-ink)]"
        >
          Etkinliklerim
        </Link>
        <Link
          href={eventJoyRoutes.messages}
          className="rounded-lg border border-border bg-card px-3 py-1.5 font-medium hover:border-primary/40 hover:text-[var(--bf-accent-ink)]"
        >
          Mesajlar
        </Link>
        <Link
          href={eventJoyRoutes.siteHome}
          className="rounded-lg border border-border bg-card px-3 py-1.5 font-medium hover:border-primary/40 hover:text-[var(--bf-accent-ink)]"
        >
          BiletFeed Ana Sayfa
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-4 border-b border-border px-6 py-8">
          <span className="flex size-20 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-[var(--bf-accent-ink)]">
            {initials}
          </span>
          <div>
            <p className="text-lg font-bold text-foreground">{name}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
            {profile.phone && (
              <p className="mt-0.5 text-sm text-muted-foreground">{profile.phone}</p>
            )}
          </div>
        </div>

        <ul className="divide-y divide-border">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between px-6 py-4 text-foreground transition hover:bg-muted/50"
              >
                <span className="font-medium">{item.label}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex w-full items-center justify-between px-6 py-4 text-left font-medium text-destructive transition hover:bg-destructive/5"
            >
              Çıkış Yap
              <ChevronRight className="size-4" />
            </button>
          </li>
        </ul>
      </div>

      <EventJoyCrossLinks className="border-t border-border pt-4" />

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/kosullar" className="hover:text-foreground hover:underline">
          Kullanım Koşulları
        </Link>
        {' · '}
        <Link href="/gizlilik" className="hover:text-foreground hover:underline">
          Gizlilik Politikası
        </Link>
      </p>
    </div>
  );
}
