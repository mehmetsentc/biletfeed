'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { AccountThemeToggle } from '@/components/account/account-theme-toggle';
import {
  getAccountMenuGroups,
  getAccountYardimMenuItem
} from '@/lib/account/navigation';
import { useTranslations } from '@/components/providers';
import {
  accountSiteHref,
  isOnAdminHost,
  isOnOrganizerPanelHost
} from '@/lib/config/domain';
import { cn } from '@/lib/utils';

/** Panel / admin alt alanında hesap sayfaları ana siteye (biletfeed.com) gider */
function resolveMenuHref(path: string, onRemoteHost: boolean): string {
  return onRemoteHost ? accountSiteHref(path) : path;
}

type AccountMenuListProps = {
  onNavigate?: () => void;
  onSignOut?: () => void;
  variant?: 'dropdown' | 'sidebar';
  organizerLinks?: ReactNode;
};

export function AccountMenuList({
  onNavigate,
  onSignOut,
  variant = 'dropdown',
  organizerLinks
}: AccountMenuListProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const accountMenuGroups = getAccountMenuGroups(t);
  const accountYardimMenuItem = getAccountYardimMenuItem(t);
  const isSidebar = variant === 'sidebar';
  const onRemoteHost = useMemo(
    () =>
      typeof window !== 'undefined' &&
      (isOnOrganizerPanelHost(window.location.hostname) ||
        isOnAdminHost(window.location.hostname)),
    []
  );

  const yardimHref = resolveMenuHref(accountYardimMenuItem.href, onRemoteHost);
  const yardimActive =
    accountYardimMenuItem.isActive?.(pathname) ?? pathname === yardimHref;
  const YardimIcon = accountYardimMenuItem.icon;

  return (
    <>
      {accountMenuGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          {groupIndex > 0 && (
            <div
              className={cn(
                'border-t border-border',
                isSidebar ? 'my-2' : 'my-1'
              )}
            />
          )}
          {group.items
            .filter(
              (item) =>
                !item.hideOnPathPrefixes?.some((prefix) =>
                  pathname.startsWith(prefix)
                )
            )
            .map((item) => {
              const active = item.isActive?.(pathname) ?? pathname === item.href;
              const Icon = item.icon;
              const href = resolveMenuHref(item.href, onRemoteHost);

              return (
                <Link
                  key={item.href}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 text-sm font-medium transition-colors',
                    isSidebar
                      ? 'rounded-xl px-3 py-2.5'
                      : 'px-4 py-2.5',
                    active
                      ? isSidebar
                        ? 'bg-primary/10 text-[var(--bf-accent-ink)]'
                        : 'bg-muted text-foreground'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
        </div>
      ))}

      <div
        className={cn(
          'border-t border-border',
          isSidebar ? 'my-2' : 'my-1'
        )}
      />
      <AccountThemeToggle variant={variant} />

      {organizerLinks}

      <div
        className={cn(
          'border-t border-border',
          isSidebar ? 'my-2' : 'my-1'
        )}
      />
      <Link
        href={yardimHref}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 text-sm font-medium transition-colors',
          isSidebar ? 'rounded-xl px-3 py-2.5' : 'px-4 py-2.5',
          yardimActive
            ? isSidebar
              ? 'bg-primary/10 text-[var(--bf-accent-ink)]'
              : 'bg-muted text-foreground'
            : 'text-foreground hover:bg-muted'
        )}
      >
        <YardimIcon className="size-4 shrink-0" strokeWidth={1.75} />
        {accountYardimMenuItem.label}
      </Link>

      {onSignOut && (
        <button
          type="button"
          onClick={onSignOut}
          className={cn(
            'flex w-full items-center gap-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10',
            isSidebar ? 'rounded-xl px-3 py-2.5' : 'px-4 py-2.5'
          )}
        >
          <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
          {t.nav.logout}
        </button>
      )}
    </>
  );
}
