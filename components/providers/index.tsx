'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from './auth-provider';
import { CookieConsentProvider } from './cookie-consent-provider';
import { ThemeProvider } from './theme-provider';
import { AuthSessionSync } from '@/components/auth/auth-session-sync';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthSessionSync />
        <CookieConsentProvider>{children}</CookieConsentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export { CityProvider, useCity, useCityOptional } from './city-provider';
