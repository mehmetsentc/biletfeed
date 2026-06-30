'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';
import { AccountMenuList } from '@/components/account/account-menu-list';
import { useAuth } from '@/components/providers/auth-provider';
import { useAccountMode } from '@/hooks/use-account-mode';
import { cn } from '@/lib/utils';
import { panelHref } from '@/lib/config/domain';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isOrganizerMode, isModeLocked } = useAccountMode();

  const displayName = user?.displayName || 'Misafir Kullanıcı';
  const email = user?.email || '';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const panelItem =
    isModeLocked && isOrganizerMode
      ? {
          href: panelHref('/organizator-panel/baslangic'),
          icon: LayoutDashboard,
          label: 'Organizatör Panel'
        }
      : null;

  async function handleSignOut() {
    await signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <Avatar className="size-12 shrink-0">
          <AvatarFallback className="bg-primary/10 font-semibold text-primary">
            {initials || 'BF'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold">{displayName}</p>
          <p className="truncate text-sm text-muted-foreground">
            {email || 'E-posta ekleyin'}
          </p>
        </div>
      </div>

      <nav className="rounded-2xl border border-border bg-card p-2">
        <AccountMenuList
          variant="sidebar"
          onSignOut={handleSignOut}
        />

        {panelItem && (
          <>
            <div className="my-2 border-t border-border" />
            <Link
              href={panelItem.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                pathname.startsWith(panelItem.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <panelItem.icon className="size-4 shrink-0" strokeWidth={1.75} />
              {panelItem.label}
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
