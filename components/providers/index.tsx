'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from './auth-provider';
import { CookieConsentProvider } from './cookie-consent-provider';
import { ThemeProvider } from './theme-provider';
import { LocaleProvider } from './locale-provider';
import { AuthSessionSync } from '@/components/auth/auth-session-sync';
import { NotificationPrefsSync } from '@/components/notifications/notification-prefs-sync';
import { CartProvider } from '@/components/providers/cart-provider';
import type { AppLocale } from '@/lib/i18n/locale';

export function Providers({
  children,
  locale
}: {
  children: ReactNode;
  locale: AppLocale;
}) {
  return (
    <ThemeProvider>
      <LocaleProvider locale={locale}>
        <AuthProvider>
          <AuthSessionSync />
          <CookieConsentProvider>
            <CartProvider>
              <NotificationPrefsSync />
              {children}
            </CartProvider>
          </CookieConsentProvider>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}

export { CityProvider, useCity, useCityOptional } from './city-provider';
export { useTranslations, useLocale } from './locale-provider';
