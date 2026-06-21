'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NewsletterFormProps {
  variant?: 'default' | 'figma';
}

export function NewsletterForm({ variant = 'default' }: NewsletterFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const isFigma = variant === 'figma';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
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
      >
        Teşekkürler! Bültenimize abone oldunuz.
      </p>
    );
  }

  if (isFigma) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md overflow-hidden rounded-lg shadow-md"
      >
        <Input
          type="email"
          required
          placeholder="E-posta adresinizi girin"
          className="h-12 flex-1 rounded-none border-0 bg-white text-foreground shadow-none focus-visible:ring-0"
        />
        <Button
          type="submit"
          className="h-12 shrink-0 rounded-none bg-[#1a1d23] px-6 font-semibold text-white hover:bg-[#1a1d23]/90"
        >
          Abone Ol
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
      <Input
        type="email"
        required
        placeholder="E-posta adresiniz"
        className="border-primary-foreground/20 bg-background/10 text-primary-foreground placeholder:text-primary-foreground/60"
      />
      <Button
        type="submit"
        variant="secondary"
        className="shrink-0 bg-background text-foreground hover:bg-background/90"
      >
        Abone Ol
      </Button>
    </form>
  );
}
