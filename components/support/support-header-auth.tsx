import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { accountSiteHref, getSiteUrl } from '@/lib/config/domain';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

function buildSupportLoginHref(returnUrl: string): string {
  return getSiteUrl(
    `/giris?redirect=${encodeURIComponent(returnUrl)}`
  );
}

export function SupportHeaderAuth({ className }: { className?: string }) {
  const { user, loading } = useAuth();
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loginHref, setLoginHref] = useState(() =>
    buildSupportLoginHref(getSiteUrl('/'))
  );

  useEffect(() => {
    setLoginHref(buildSupportLoginHref(window.location.href));

    let cancelled = false;
    void fetch('/api/auth/me', {
      credentials: 'same-origin',
      cache: 'no-store'
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { user?: User | null };
        return data.user ?? null;
      })
      .then((meUser) => {
        if (!cancelled) {
          setSessionUser(meUser);
          setSessionChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) setSessionChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveUser = user ?? sessionUser;
  const pending = loading || !sessionChecked;

  if (pending) {
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

  if (effectiveUser) {
    return (
      <Link
        href={accountSiteHref('/profil/destek')}
        className={cn(
          'rounded-lg border border-[#f5a623]/40 bg-amber-50 px-4 py-2 text-sm font-semibold text-[#c78600] transition-colors hover:bg-amber-100',
          className
        )}
      >
        Hesabım
      </Link>
    );
  }

  return (
    <Link
      href={loginHref}
      className={cn(
        'rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90',
        className
      )}
    >
      Giriş Yap
    </Link>
  );
}
