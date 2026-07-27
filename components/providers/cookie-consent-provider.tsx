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
import {
  isNativeIosApp,
  isTrackingAuthorized,
  purgeTrackingArtifacts
} from '@/lib/tracking/att';

interface CookieConsentContextValue {
  choice: CookieConsentChoice | null;
  preferences: CookiePreferences | null;
  /** iOS ATT reddedildi — analitik/pazarlama açılamaz */
  trackingBlockedByAtt: boolean;
  acceptAll: () => void;
  rejectOptional: () => void;
  savePreferences: (preferences: CookiePreferences) => void;
  openPreferences: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null
);

function forceNecessaryOnly(
  setChoice: (c: CookieConsentChoice) => void,
  setPreferences: (p: CookiePreferences) => void
) {
  saveCookieConsent('necessary', necessaryOnlyPreferences);
  setChoice('necessary');
  setPreferences(necessaryOnlyPreferences);
  purgeTrackingArtifacts();
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(null);
  const [preferences, setPreferences] = useState<CookiePreferences | null>(
    null
  );
  const [ready, setReady] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [trackingBlockedByAtt, setTrackingBlockedByAtt] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const nativeIos = await isNativeIosApp();
      const attOk = await isTrackingAuthorized();

      if (cancelled) return;

      // Guideline 5.1.1(iv): ATT reddinden sonra tracking çerez teklifi / toplama yok
      if (nativeIos && !attOk) {
        setTrackingBlockedByAtt(true);
        forceNecessaryOnly(setChoice, setPreferences);
        setReady(true);
        return;
      }

      setTrackingBlockedByAtt(false);
      const storedChoice = readCookieConsent();
      const storedPrefs = readCookiePreferences();
      setChoice(storedChoice);
      setPreferences(storedPrefs);
      setReady(true);

      const params = new URLSearchParams(window.location.search);
      if (params.get('cerez-tercihleri') === '1') {
        setPrefsOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const acceptAll = useCallback(async () => {
    if (trackingBlockedByAtt || ((await isNativeIosApp()) && !(await isTrackingAuthorized()))) {
      forceNecessaryOnly(setChoice, setPreferences);
      setPrefsOpen(false);
      return;
    }
    saveCookieConsent('all', defaultPreferences);
    setChoice('all');
    setPreferences(defaultPreferences);
    setPrefsOpen(false);
  }, [trackingBlockedByAtt]);

  const rejectOptional = useCallback(() => {
    forceNecessaryOnly(setChoice, setPreferences);
    setPrefsOpen(false);
  }, []);

  const savePreferences = useCallback(
    async (next: CookiePreferences) => {
      const blocked =
        trackingBlockedByAtt ||
        ((await isNativeIosApp()) && !(await isTrackingAuthorized()));

      if (blocked) {
        forceNecessaryOnly(setChoice, setPreferences);
        setPrefsOpen(false);
        return;
      }

      const hasOptional = next.functional || next.analytics || next.marketing;
      const level: CookieConsentChoice = hasOptional ? 'all' : 'necessary';
      saveCookieConsent(level, { ...next, necessary: true });
      setChoice(level);
      setPreferences({ ...next, necessary: true });
      setPrefsOpen(false);
    },
    [trackingBlockedByAtt]
  );

  const openPreferences = useCallback(() => setPrefsOpen(true), []);

  const value = useMemo(
    () => ({
      choice,
      preferences,
      trackingBlockedByAtt,
      acceptAll: () => {
        void acceptAll();
      },
      rejectOptional,
      savePreferences: (prefs: CookiePreferences) => {
        void savePreferences(prefs);
      },
      openPreferences
    }),
    [
      choice,
      preferences,
      trackingBlockedByAtt,
      acceptAll,
      rejectOptional,
      savePreferences,
      openPreferences
    ]
  );

  // ATT reddinde banner gösterme — tracking teklifi App Review'u düşürür
  const showBanner = ready && choice === null && !trackingBlockedByAtt;

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {showBanner && (
        <CookieConsentBanner
          onAccept={() => {
            void acceptAll();
          }}
          onReject={rejectOptional}
          onOpenPreferences={() => setPrefsOpen(true)}
        />
      )}
      <CookiePreferencesDialog
        open={prefsOpen}
        onOpenChange={setPrefsOpen}
        initialPreferences={
          trackingBlockedByAtt
            ? necessaryOnlyPreferences
            : (preferences ?? defaultPreferences)
        }
        trackingBlockedByAtt={trackingBlockedByAtt}
        onSave={(prefs) => {
          void savePreferences(prefs);
        }}
        onAcceptAll={() => {
          void acceptAll();
        }}
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
