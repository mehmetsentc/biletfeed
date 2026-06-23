'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { AccountProfileTabs } from '@/components/account/account-profile-tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
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

export function SupportPageClient() {
  const { isConfigured } = useAuth();
  const [category, setCategory] = useState<SupportCategory>('other');
  const [menuOpen, setMenuOpen] = useState(false);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = SUPPORT_SUBJECTS[category];

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
        const data = await res.json();
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

  return (
    <div className="max-w-3xl">
      <AccountProfileTabs />

      <section className="mt-2 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-5 md:px-6">
          <h1 className="text-xl font-bold tracking-tight">Destek</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Destek taleplerinizi gönderebilirsiniz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-5 py-6 md:px-6 md:py-8">
          <div ref={menuRef} className="space-y-2">
            <label className="text-sm font-medium text-foreground">Konu</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-xl bg-muted/70 px-4 py-3.5 text-left text-sm ring-1 ring-border/60 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span>
                  <span className="font-medium">{selected.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {selected.description}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    'size-4 shrink-0 text-muted-foreground transition-transform',
                    menuOpen && 'rotate-180'
                  )}
                />
              </button>

              {menuOpen && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                  {subjectOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setCategory(option.value);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <span>
                        <span className="font-medium">{option.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                      {category === option.value && (
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
              rows={8}
              placeholder="Mesajınızı yazın..."
              className="w-full resize-none rounded-xl border-0 bg-muted/70 px-4 py-3 text-sm ring-1 ring-border/60 outline-none placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <span>Detaylı açıklama, daha hızlı çözüm sağlar</span>
              <span>
                {body.length}/{MAX_LENGTH}
              </span>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
              Destek talebiniz alındı. En kısa sürede size dönüş yapacağız.
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting || success}
            className="h-12 w-full rounded-full text-base font-semibold"
          >
            <Check className="size-4" />
            {submitting ? 'Gönderiliyor…' : 'Destek Talebi Gönder'}
          </Button>
        </form>
      </section>
    </div>
  );
}
