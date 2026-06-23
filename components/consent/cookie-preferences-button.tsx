'use client';

import type { ReactNode } from 'react';
import { useCookieConsentOptional } from '@/components/providers/cookie-consent-provider';

export function CookiePreferencesButton({
  className,
  children = 'Çerez Tercihleri'
}: {
  className?: string;
  children?: ReactNode;
}) {
  const consent = useCookieConsentOptional();
  if (!consent) return null;

  return (
    <button
      type="button"
      onClick={consent.openPreferences}
      className={className}
    >
      {children}
    </button>
  );
}
