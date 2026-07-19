'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plus } from 'lucide-react';
import { AccountMenuList } from '@/components/account/account-menu-list';
import { useAuth } from '@/components/providers/auth-provider';
import { useTranslations } from '@/components/providers';
import { cn } from '@/lib/utils';
import { panelHref, PANEL_EXTERNAL_LINK_PROPS } from '@/lib/config/domain';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function AccountSidebar() {
  const t = useTranslations();
  const { user, signOut } = useAuth();

  const displayName = user?.displayName || t.account.guestUser;
  const email = user?.email || '';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    await signOut();
    window.location.assign('/giris');
  }

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <Avatar className="size-12 shrink-0">
          <AvatarFallback className="bg-primary/10 font-semibold text-[var(--bf-accent-ink)]">
            {initials || 'BF'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold">{displayName}</p>
          <p className="truncate text-sm text-muted-foreground">
            {email || t.account.addEmail}
          </p>
        </div>
      </div>

      <nav className="rounded-2xl border border-border bg-card p-2">
        <AccountMenuList
          variant="sidebar"
          onSignOut={handleSignOut}
          organizerLinks={
            <>
              <div className="my-2 border-t border-border" />
              <Link
                href={panelHref('/organizator-panel/etkinlik/yeni')}
                {...PANEL_EXTERNAL_LINK_PROPS}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--bf-accent-ink)] transition-colors hover:bg-muted"
              >
                <Plus className="size-4 shrink-0" strokeWidth={1.75} />
                {t.account.createEvent}
              </Link>
              <Link
                href={panelHref('/organizator-panel/baslangic')}
                {...PANEL_EXTERNAL_LINK_PROPS}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <LayoutDashboard className="size-4 shrink-0" strokeWidth={1.75} />
                {t.account.organizerPanel}
              </Link>
            </>
          }
        />
      </nav>
    </aside>
  );
}
