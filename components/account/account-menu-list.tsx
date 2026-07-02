'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { Globe, LogOut } from 'lucide-react';
import { AccountThemeToggle } from '@/components/account/account-theme-toggle';
import { accountMenuGroups } from '@/lib/account/navigation';
import { useAccountMode } from '@/hooks/use-account-mode';
import {
  accountSiteHref,
  isOnOrganizerPanelHost
} from '@/lib/config/domain';
import { cn } from '@/lib/utils';

function resolveMenuHref(path: string, onPanelHost: boolean): string {
  return onPanelHost ? accountSiteHref(path) : path;
}

type AccountMenuListProps = {
  onNavigate?: () => void;
  onSignOut?: () => void;
  variant?: 'dropdown' | 'sidebar';
};

export function AccountMenuList({
  onNavigate,
  onSignOut,
  variant = 'dropdown'
}: AccountMenuListProps) {
  const pathname = usePathname();
  const { isOrganizerMode, isModeLocked } = useAccountMode();
  const isSidebar = variant === 'sidebar';
  const showUserOnlyItems = !isModeLocked || !isOrganizerMode;
  const onPanelHost = useMemo(
    () =>
      typeof window !== 'undefined' &&
      isOnOrganizerPanelHost(window.location.hostname),
    []
  );

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
            .filter((item) => !item.userOnly || showUserOnlyItems)
            .filter(
              (item) =>
                !item.hideOnPathPrefixes?.some((prefix) =>
                  pathname.startsWith(prefix)
                )
            )
            .map((item) => {
            const active = item.isActive?.(pathname) ?? pathname === item.href;
            const Icon = item.icon;

            const href = resolveMenuHref(item.href, onPanelHost);

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
                      ? 'bg-primary/10 text-primary'
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
      <div
        className={cn(
          'flex items-center gap-3 text-sm font-medium text-muted-foreground',
          isSidebar ? 'rounded-xl px-3 py-2.5' : 'px-4 py-2.5'
        )}
      >
        <Globe className="size-4 shrink-0" strokeWidth={1.75} />
        Türkçe
      </div>

      {onSignOut && (
        <>
          <div
            className={cn(
              'border-t border-border',
              isSidebar ? 'my-2' : 'my-1'
            )}
          />
          <button
            type="button"
            onClick={onSignOut}
            className={cn(
              'flex w-full items-center gap-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10',
              isSidebar ? 'rounded-xl px-3 py-2.5' : 'px-4 py-2.5'
            )}
          >
            <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
            Çıkış Yap
          </button>
        </>
      )}
    </>
  );
}
