'use client';

import { LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { resolveProfileDisplayName } from '@/lib/account/display-name';
import { siteHref } from '@/lib/config/domain';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PanelProfileMenu() {
  const { user, signOutPanel } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayName = resolveProfileDisplayName({
    displayName: user?.displayName,
    email: user?.email
  });
  const email = user?.email || '';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-full text-white hover:bg-white/10"
        aria-label="Hesap menüsü"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <User className="size-5" />
      </Button>

      {open ? (
        <div
          className={cn(
            'absolute right-0 z-50 mt-2 w-56 rounded-md border border-white/10',
            'bg-[#151a24] p-1 text-white shadow-lg'
          )}
          role="menu"
        >
          <div className="border-b border-white/10 px-3 py-2">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {email ? (
              <p className="truncate text-xs text-white/60">{email}</p>
            ) : null}
          </div>
          <a
            href={siteHref('/profil')}
            className="block rounded-sm px-3 py-2 text-sm hover:bg-white/10"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            BiletFeed profilim
          </a>
          <a
            href={siteHref('/')}
            className="block rounded-sm px-3 py-2 text-sm hover:bg-white/10"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Ana siteye git
          </a>
          <button
            type="button"
            className="flex w-full items-center rounded-sm px-3 py-2 text-sm text-red-300 hover:bg-white/10"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOutPanel();
            }}
          >
            <LogOut className="mr-2 size-4" />
            Panelden çıkış yap
          </button>
        </div>
      ) : null}
    </div>
  );
}
