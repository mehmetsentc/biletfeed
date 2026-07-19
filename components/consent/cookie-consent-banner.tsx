'use client';

import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/components/providers';

export function CookieConsentBanner({
  onAccept,
  onReject,
  onOpenPreferences
}: {
  onAccept: () => void;
  onReject: () => void;
  onOpenPreferences: () => void;
}) {
  const t = useTranslations();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:p-4"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-md md:flex-row md:items-center md:gap-6 md:p-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Cookie className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0">
            <p
              id="cookie-consent-title"
              className="text-sm font-semibold text-foreground md:text-base"
            >
              {t.consent.title}
            </p>
            <p
              id="cookie-consent-desc"
              className="mt-1.5 text-xs leading-relaxed text-muted-foreground md:text-sm"
            >
              {t.consent.bodyBefore}{' '}
              <button
                type="button"
                onClick={onReject}
                className="font-medium text-foreground underline underline-offset-2 hover:text-[var(--bf-accent-ink)]"
              >
                {t.common.reject}
              </button>{' '}
              {t.consent.rejectContinue}{' '}
              <Link
                href="/cerezler"
                className="font-medium text-foreground underline underline-offset-2 hover:text-[var(--bf-accent-ink)]"
              >
                {t.consent.cookiePolicy}
              </Link>{' '}
              {t.consent.and}{' '}
              <button
                type="button"
                onClick={onOpenPreferences}
                className="font-medium text-foreground underline underline-offset-2 hover:text-[var(--bf-accent-ink)]"
              >
                {t.common.preferences}
              </button>
              {t.consent.fromPreferences}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={onAccept}
          className="h-11 shrink-0 px-8 text-sm font-semibold md:min-w-[140px]"
        >
          {t.consent.accept}
        </Button>
      </div>
    </div>
  );
}
