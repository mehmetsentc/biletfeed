'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  LayoutDashboard,
  Plus,
  Ticket
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { AccountMenuList } from '@/components/account/account-menu-list';
import { useAuth } from '@/components/providers/auth-provider';
import { useAccountMode } from '@/hooks/use-account-mode';
import { useOrganizerApproval } from '@/hooks/use-organizer-approval';
import { isAccountAreaActive } from '@/lib/account/navigation';
import { panelHref, PANEL_EXTERNAL_LINK_PROPS } from '@/lib/config/domain';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { resolveProfileDisplayName } from '@/lib/account/display-name';
import { cn } from '@/lib/utils';

export function ProfileDropdown() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { isOrganizerMode, isModeLocked } = useAccountMode();
  const { isApproved } = useOrganizerApproval();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayName = resolveProfileDisplayName({
    displayName: user?.displayName,
    email: user?.email
  });
  const email = user?.email || '';
  const initials = useMemo(() => {
    const source = displayName || user?.email || 'BF';
    return (
      source
        .split(/[\s@]+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'BF'
    );
  }, [displayName, user?.email]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const isProfileActive = isAccountAreaActive(pathname);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    window.location.assign('/giris');
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'group flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-[var(--header-fg)] transition-all duration-200 ease-[var(--ease-out)] hover:bg-[var(--header-hover)] hover:text-primary sm:gap-2.5 sm:pr-3',
          isProfileActive && 'text-primary',
          open && 'bg-[var(--header-hover)] text-primary'
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar className="size-8 border border-[var(--header-border)] shadow-[var(--shadow-xs)] transition-transform duration-200 group-hover:scale-[1.02] sm:size-9">
          <AvatarFallback className="bg-primary/12 text-xs font-bold text-primary sm:text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[7rem] truncate text-sm font-semibold sm:inline">
          {displayName}
        </span>
        <ChevronDown
          className={cn(
            'size-4 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[260px] overflow-hidden rounded-[var(--radius-card)] border border-border/80 bg-background/95 py-2 shadow-[var(--shadow-lg)] backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-200"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            {email && (
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            )}
          </div>

          <AccountMenuList
            onNavigate={() => setOpen(false)}
            onSignOut={handleSignOut}
            organizerLinks={
              isModeLocked && isOrganizerMode && isApproved ? (
                <>
                  <div className="my-1 border-t border-border" />
                  <Link
                    href={panelHref('/organizator-panel/etkinlik/yeni')}
                    {...PANEL_EXTERNAL_LINK_PROPS}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-muted"
                  >
                    <Plus className="size-4 shrink-0" strokeWidth={1.75} />
                    Etkinlik Oluştur
                  </Link>
                  <Link
                    href={panelHref('/organizator-panel/baslangic')}
                    {...PANEL_EXTERNAL_LINK_PROPS}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <LayoutDashboard
                      className="size-4 shrink-0"
                      strokeWidth={1.75}
                    />
                    Organizatör Panel
                  </Link>
                </>
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  );
}

export function HeaderIconLink({
  href,
  icon: Icon,
  label,
  active
}: {
  href: string;
  icon: typeof Ticket;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'hidden flex-col items-center gap-0.5 px-2 py-1 text-[var(--header-fg)] transition-colors hover:text-primary sm:flex',
        active && 'text-primary'
      )}
    >
      <Icon className="size-5" strokeWidth={1.75} />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
