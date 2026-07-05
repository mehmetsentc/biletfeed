'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { accountSiteHref, getSiteUrl } from '@/lib/config/domain';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

function buildSupportLoginHref(returnUrl: string): string {
  return getSiteUrl(
    `/api/auth/sync-session?redirect=${encodeURIComponent(returnUrl)}`
  );
}

interface SupportHeaderAuthProps {
  className?: string;
  initialLoggedIn?: boolean;
}

export function SupportHeaderAuth({
  className,
  initialLoggedIn = false
}: SupportHeaderAuthProps) {
  const { user, loading } = useAuth();
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [sessionChecked, setSessionChecked] = useState(initialLoggedIn);
  const [loginHref, setLoginHref] = useState(() =>
    buildSupportLoginHref(getSiteUrl('/'))
  );

  useEffect(() => {
    setLoginHref(buildSupportLoginHref(window.location.href));

    if (initialLoggedIn) return;

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
  }, [initialLoggedIn]);

  const isLoggedIn =
    initialLoggedIn || Boolean(user) || Boolean(sessionUser);
  const pending = !initialLoggedIn && (loading || !sessionChecked);

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

  if (isLoggedIn) {
    return (
      <Link
        href={accountSiteHref('/profil/destek')}
        className={cn(
          'rounded-lg border border-[var(--bf-orange-border)] bg-[var(--bf-orange-surface)] px-4 py-2 text-sm font-semibold text-[#c78600] transition-colors hover:bg-[var(--bf-orange-soft)]',
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
        'rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90',
        className
      )}
    >
      Giriş Yap
    </Link>
  );
}
