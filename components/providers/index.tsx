'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from './auth-provider';
import { CookieConsentProvider } from './cookie-consent-provider';
import { ThemeProvider } from './theme-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CookieConsentProvider>{children}</CookieConsentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export { CityProvider, useCity, useCityOptional } from './city-provider';
