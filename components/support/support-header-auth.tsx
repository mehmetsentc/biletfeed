'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { accountSiteHref, getSiteUrl } from '@/lib/config/domain';
import { cn } from '@/lib/utils';

export function SupportHeaderAuth({ className }: { className?: string }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <span
        className={cn(
          'inline-block h-9 w-24 animate-pulse rounded-lg bg-zinc-200',
          className
        )}
        aria-hidden
      />
    );
  }

  if (user) {
    return (
      <Link
        href={accountSiteHref('/profil/destek')}
        className={cn(
          'rounded-lg border border-[#f5a623]/40 bg-amber-50 px-4 py-2 text-sm font-semibold text-[#c78600] transition-colors hover:bg-amber-100',
          className
        )}
      >
        Hesap desteği
      </Link>
    );
  }

  return (
    <Link
      href={getSiteUrl('/giris?redirect=/profil/destek')}
      className={cn(
        'rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90',
        className
      )}
    >
      Giriş Yap
    </Link>
  );
}
