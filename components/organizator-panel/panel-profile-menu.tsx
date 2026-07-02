'use client';

import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { resolveProfileDisplayName } from '@/lib/account/display-name';
import { siteHref } from '@/lib/config/domain';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function PanelProfileMenu() {
  const { user, signOutPanel } = useAuth();
  const displayName = resolveProfileDisplayName({
    displayName: user?.displayName,
    email: user?.email
  });
  const email = user?.email || '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-full text-white hover:bg-white/10"
          aria-label="Hesap menüsü"
        >
          <User className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{displayName}</p>
          {email ? (
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={siteHref('/profil')}>BiletFeed profilim</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={siteHref('/')}>Ana siteye git</a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => void signOutPanel()}
        >
          <LogOut className="mr-2 size-4" />
          Panelden çıkış yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
