'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getSiteUrl } from '@/lib/config/domain';
import { Button } from '@/components/ui/button';
import {
  SUPPORT_SUBJECTS,
  type SupportCategory
} from '@/lib/services/user-support';
import { cn } from '@/lib/utils';

const subjectOptions = Object.entries(SUPPORT_SUBJECTS).map(([value, meta]) => ({
  value: value as SupportCategory,
  ...meta
}));

const MAX_LENGTH = 1000;

interface SupportTicketFormProps {
  initialLoggedIn?: boolean;
}

function buildLoginHref(returnUrl: string): string {
  return getSiteUrl(
    `/api/auth/sync-session?redirect=${encodeURIComponent(returnUrl)}`
  );
}

export function SupportTicketForm({
  initialLoggedIn = false
}: SupportTicketFormProps) {
  const { user, loading, isConfigured } = useAuth();
  const [category, setCategory] = useState<SupportCategory>('other');
  const [menuOpen, setMenuOpen] = useState(false);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loginHref, setLoginHref] = useState(() =>
    buildLoginHref(getSiteUrl('/'))
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = initialLoggedIn || Boolean(user);
  const pendingAuth = !initialLoggedIn && loading;

  useEffect(() => {
    setLoginHref(buildLoginHref(window.location.href));
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!isLoggedIn) {
      setError('Destek talebi göndermek için giriş yapmalısınız.');
      return;
    }

    if (body.trim().length < 10) {
      setError('Mesajınız en az 10 karakter olmalıdır.');
      return;
    }

    setSubmitting(true);
    try {
      if (isConfigured) {
        const res = await fetch('/api/support', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, body: body.trim() })
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(data.error || 'Destek talebi gönderilemedi');
        }
      }

      setSuccess(true);
      setBody('');
      setCategory('other');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Destek talebi gönderilemedi'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selected = SUPPORT_SUBJECTS[category];

  if (pendingAuth) {
    return (
      <div className="h-48 animate-pulse rounded-2xl bg-zinc-100" aria-hidden />
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-600">
          Destek talebi göndermek için BiletFeed hesabınızla giriş yapın. Ana
          sitede oturumunuz açıksa tek tıkla senkronize olursunuz.
        </p>
        <Button asChild className="mt-4 w-full bg-[#f5a623] hover:bg-[#e09520]">
          <Link href={loginHref}>Giriş yap / oturumu eşitle</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div ref={menuRef} className="space-y-2">
        <label className="text-sm font-medium text-zinc-900">Konu</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-xl bg-zinc-50 px-4 py-3.5 text-left text-sm ring-1 ring-zinc-200 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623]/40"
          >
            <span>
              <span className="font-medium">{selected.label}</span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                {selected.description}
              </span>
            </span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-zinc-500 transition-transform',
                menuOpen && 'rotate-180'
              )}
            />
          </button>

          {menuOpen && (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
              {subjectOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setCategory(option.value);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-zinc-50"
                >
                  <span>
                    <span className="font-medium">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {option.description}
                    </span>
                  </span>
                  {category === option.value && (
                    <Check className="mt-0.5 size-4 shrink-0 text-[#f5a623]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="support-body" className="text-sm font-medium text-zinc-900">
          Mesajınız
        </label>
        <textarea
          id="support-body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
          rows={8}
          placeholder="Sorununuzu, sipariş veya etkinlik bilgisini detaylı yazın…"
          className="w-full resize-none rounded-xl border-0 bg-zinc-50 px-4 py-3 text-sm ring-1 ring-zinc-200 outline-none placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-[#f5a623]/40"
        />
        <div className="flex items-center justify-between gap-4 text-xs text-zinc-500">
          <span>Detaylı açıklama daha hızlı çözüm sağlar</span>
          <span>
            {body.length}/{MAX_LENGTH}
          </span>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-[#c78600]">
          Destek talebiniz alındı. En kısa sürede size dönüş yapacağız.
        </p>
      )}

      <Button
        type="submit"
        disabled={submitting || success}
        className="h-12 w-full rounded-full bg-[#f5a623] text-base font-semibold hover:bg-[#e09520]"
      >
        <Check className="size-4" />
        {submitting ? 'Gönderiliyor…' : 'Destek Talebi Gönder'}
      </Button>
    </form>
  );
}
