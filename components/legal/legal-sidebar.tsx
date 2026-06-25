'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { legalSidebarLinks } from '@/lib/legal/sidebar-links';
import { cn } from '@/lib/utils';

export function LegalSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const activeLink = legalSidebarLinks.find(
    (l) => pathname === l.href || pathname.startsWith(`${l.href}/`)
  );

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-64 lg:self-start">

      {/* ── Mobil: dropdown accordion ── */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 text-left shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-primary" />
            <span className="font-semibold text-foreground">
              {activeLink?.label ?? 'Sayfalar'}
            </span>
          </div>
          <ChevronDown
            className={cn(
              'size-5 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>

        {open && (
          <nav
            className="mt-1 overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
            aria-label="Yasal sayfalar"
          >
            {legalSidebarLinks.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 border-b border-border px-4 py-3.5 text-sm font-medium transition-colors last:border-b-0',
                    active
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  {active && (
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* ── Masaüstü: sabit liste ── */}
      <nav
        className="hidden flex-col gap-1 rounded-2xl border border-border bg-card p-3 lg:flex"
        aria-label="Yasal sayfalar"
      >
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                'rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
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
