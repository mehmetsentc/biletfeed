'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Star, Ticket, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ProfileDropdown() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const menuItems = [
    { href: '/profil/ilgi-alanlari', label: 'İlgi Alanları' },
    { href: '/profil', label: 'Hesap Ayarları' }
  ];

  const isProfileActive =
    pathname.startsWith('/profil') || pathname === '/biletlerim';

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex flex-col items-center gap-0.5 px-2 py-1 text-[var(--header-fg)] transition-colors hover:text-primary',
          isProfileActive && 'text-primary'
        )}
      >
        <span className="flex items-center gap-0.5">
          <User className="size-5" strokeWidth={1.75} />
          <ChevronDown className="size-3" />
        </span>
        <span className="text-[10px] font-medium">Profil</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-lg border border-border bg-background py-1 shadow-lg">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'block px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted',
                pathname === item.href && 'bg-muted font-medium'
              )}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.push('/');
              router.refresh();
            }}
            className="block w-full px-4 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-muted"
          >
            Çıkış Yap
          </button>
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
