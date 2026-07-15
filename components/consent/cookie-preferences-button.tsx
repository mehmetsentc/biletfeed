'use client';

import type { ReactNode } from 'react';
import { useTranslations } from '@/components/providers';
import { useCookieConsentOptional } from '@/components/providers/cookie-consent-provider';

export function CookiePreferencesButton({
  className,
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  const t = useTranslations();
  const consent = useCookieConsentOptional();
  if (!consent) return null;

  return (
    <button
      type="button"
      onClick={consent.openPreferences}
      className={className}
    >
      {children ?? t.consent.openPreferences}
    </button>
  );
}
