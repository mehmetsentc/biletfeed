'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { legalSidebarLinks } from '@/lib/legal/sidebar-links';
import { cn } from '@/lib/utils';

export function LegalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-64 lg:self-start">
      <nav
        className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-2 lg:p-3"
        aria-label="Yasal sayfalar"
      >
        <p className="hidden px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:block">
          Kurumsal & Yasal
        </p>
        {legalSidebarLinks.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:px-4',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
