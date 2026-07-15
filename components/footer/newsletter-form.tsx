'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/components/providers';
import { useCity } from '@/components/providers/city-provider';
import { cn } from '@/lib/utils';

interface NewsletterFormProps {
  variant?: 'default' | 'figma';
  onSubscribed?: () => void;
}

const SUCCESS_HIDE_MS = 4500;

export function NewsletterForm({ variant = 'default', onSubscribed }: NewsletterFormProps) {
  const t = useTranslations();
  const { citySlug, cityName } = useCity();
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isFigma = variant === 'figma';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const form = e.currentTarget;
    const emailInput = form.elements.namedItem('email') as HTMLInputElement;
    const email = emailInput?.value?.trim();
    if (!email) return;

    setLoading(true);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, source: 'homepage', citySlug }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        cityName?: string | null;
      };

      if (!res.ok) {
        setError(data.error ?? t.newsletter.error);
        return;
      }

      setSuccessMessage(
        data.message ??
          (data.cityName ?? cityName
            ? `${data.cityName ?? cityName} etkinlikleri dahil bültenimize abone oldunuz`
            : t.home.newsletterTitle)
      );
      setSubmitted(true);
      window.setTimeout(() => onSubscribed?.(), SUCCESS_HIDE_MS);
    } catch {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <p
        className={cn(
          'rounded-xl px-4 py-3 text-sm font-medium',
          isFigma
            ? 'bg-[#1a1d23]/10 text-[#1a1d23]'
            : 'bg-background/15 text-primary-foreground'
        )}
        role="status"
        aria-live="polite"
      >
        {successMessage}. {t.newsletter.success}
      </p>
    );
  }

  if (isFigma) {
    return (
      <div className="w-full max-w-md space-y-2">
        <form
          onSubmit={handleSubmit}
          className="flex w-full overflow-hidden rounded-lg shadow-md"
        >
          <Input
            type="email"
            name="email"
            required
            disabled={loading}
            placeholder={t.newsletter.emailPlaceholder}
            className="h-12 flex-1 rounded-none border-0 bg-white text-foreground shadow-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            disabled={loading}
            className="h-12 shrink-0 rounded-none bg-[#1a1d23] px-6 font-semibold text-white hover:bg-[#1a1d23]/90"
          >
            {loading ? t.common.processing : t.newsletter.subscribe}
          </Button>
        </form>
        {error && (
          <p className="text-sm font-medium text-[#1a1d23]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-2">
      <form onSubmit={handleSubmit} className="flex w-full gap-2">
        <Input
          type="email"
          name="email"
          required
          disabled={loading}
          placeholder={t.home.newsletterPlaceholder}
          className="border-primary-foreground/20 bg-background/10 text-primary-foreground placeholder:text-primary-foreground/60"
        />
        <Button
          type="submit"
          disabled={loading}
          variant="secondary"
          className="shrink-0 bg-background text-foreground hover:bg-background/90"
        >
          {loading ? t.common.processing : t.newsletter.subscribe}
        </Button>
      </form>
      {error && (
        <p className="text-sm text-primary-foreground/90" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
