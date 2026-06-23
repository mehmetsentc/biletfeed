'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import {
  type CookieConsentChoice,
  type CookiePreferences,
  readCookieConsent,
  readCookiePreferences,
  saveCookieConsent,
  defaultPreferences,
  necessaryOnlyPreferences
} from '@/lib/cookies/consent';
import { CookieConsentBanner } from '@/components/consent/cookie-consent-banner';
import { CookiePreferencesDialog } from '@/components/consent/cookie-preferences-dialog';

interface CookieConsentContextValue {
  choice: CookieConsentChoice | null;
  preferences: CookiePreferences | null;
  acceptAll: () => void;
  rejectOptional: () => void;
  savePreferences: (preferences: CookiePreferences) => void;
  openPreferences: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(null);
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [ready, setReady] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  useEffect(() => {
    const storedChoice = readCookieConsent();
    const storedPrefs = readCookiePreferences();
    setChoice(storedChoice);
    setPreferences(storedPrefs);
    setReady(true);

    const params = new URLSearchParams(window.location.search);
    if (params.get('cerez-tercihleri') === '1') {
      setPrefsOpen(true);
    }
  }, []);

  const acceptAll = useCallback(() => {
    saveCookieConsent('all', defaultPreferences);
    setChoice('all');
    setPreferences(defaultPreferences);
    setPrefsOpen(false);
  }, []);

  const rejectOptional = useCallback(() => {
    saveCookieConsent('necessary', necessaryOnlyPreferences);
    setChoice('necessary');
    setPreferences(necessaryOnlyPreferences);
    setPrefsOpen(false);
  }, []);

  const savePreferences = useCallback((next: CookiePreferences) => {
    const hasOptional = next.functional || next.analytics || next.marketing;
    const level: CookieConsentChoice = hasOptional ? 'all' : 'necessary';
    saveCookieConsent(level, { ...next, necessary: true });
    setChoice(level);
    setPreferences({ ...next, necessary: true });
    setPrefsOpen(false);
  }, []);

  const openPreferences = useCallback(() => setPrefsOpen(true), []);

  const value = useMemo(
    () => ({
      choice,
      preferences,
      acceptAll,
      rejectOptional,
      savePreferences,
      openPreferences
    }),
    [choice, preferences, acceptAll, rejectOptional, savePreferences, openPreferences]
  );

  const showBanner = ready && choice === null;

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {showBanner && (
        <CookieConsentBanner
          onAccept={acceptAll}
          onReject={rejectOptional}
          onOpenPreferences={() => setPrefsOpen(true)}
        />
      )}
      <CookiePreferencesDialog
        open={prefsOpen}
        onOpenChange={setPrefsOpen}
        initialPreferences={preferences ?? defaultPreferences}
        onSave={savePreferences}
        onAcceptAll={acceptAll}
      />
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}

export function useCookieConsentOptional() {
  return useContext(CookieConsentContext);
}
