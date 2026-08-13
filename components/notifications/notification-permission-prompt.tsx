'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/components/providers';
import { useAuth } from '@/components/providers/auth-provider';
import { useCookieConsentOptional } from '@/components/providers/cookie-consent-provider';
import { useCityOptional } from '@/components/providers/city-provider';
import {
  ACCEPTED_NOTIFICATION_PACKAGE,
  GUEST_PREFS_KEY,
  saveNotificationPreferences
} from '@/lib/account/notification-preferences';
import {
  readNotificationOnboarding,
  saveNotificationOnboarding
} from '@/lib/notifications/onboarding';
import {
  registerPushTokenOnServer,
  requestNotificationPermission,
  syncPreferencesToServer
} from '@/lib/notifications/client';

/**
 * Çerez onayından (ve şehir seçiminden) sonra soft “Bildirimlere izin ver” prompt’u.
 * Kabul → e-posta + bülten + push tercihleri açılır, OS izni istenir.
 */
export function NotificationPermissionPrompt() {
  const t = useTranslations();
  const { user } = useAuth();
  const cookie = useCookieConsentOptional();
  const city = useCityOptional();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cookie || cookie.choice === null) {
      setVisible(false);
      return;
    }

    if (readNotificationOnboarding() !== 'pending') {
      setVisible(false);
      return;
    }

    // Şehir seçimi zorunluysa önce onu bitir (üst üste modal olmasın)
    if (city && !city.hasChosenCity) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      if (readNotificationOnboarding() === 'pending') {
        setVisible(true);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [cookie, cookie?.choice, city, city?.hasChosenCity]);

  const dismiss = useCallback(() => {
    saveNotificationOnboarding('dismissed');
    setVisible(false);
  }, []);

  const accept = useCallback(async () => {
    setBusy(true);
    try {
      const prefs = { ...ACCEPTED_NOTIFICATION_PACKAGE };
      const uid = user?.uid ?? GUEST_PREFS_KEY;
      saveNotificationPreferences(uid, prefs);
      if (user?.uid) {
        saveNotificationPreferences(GUEST_PREFS_KEY, prefs);
      }

      const result = await requestNotificationPermission();
      if (!result.granted) {
        prefs.push = false;
        saveNotificationPreferences(uid, prefs);
      }

      if (user) {
        await syncPreferencesToServer(prefs, {
          subscribeNewsletter: prefs.newsletter
        });
        if (result.granted && result.token) {
          await registerPushTokenOnServer(result.token, result.platform);
        }
      }

      saveNotificationOnboarding('accepted');
      setVisible(false);

      // Profesyonel onay geri bildirimi (izin verildiyse)
      if (
        result.granted &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(t.notifications.welcomeTitle, {
            body: t.notifications.welcomeBody,
            icon: '/brand/favicon-192.png',
            tag: 'bf-welcome-notifications'
          });
        } catch {
          // ignore
        }
      }
    } finally {
      setBusy(false);
    }
  }, [user, t.notifications.welcomeBody, t.notifications.welcomeTitle]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[95] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:p-4"
      role="dialog"
      aria-labelledby="notification-permission-title"
      aria-describedby="notification-permission-desc"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-md md:flex-row md:items-center md:gap-6 md:p-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--bf-accent)_18%,transparent)]">
            <Bell
              className="size-5 text-[var(--bf-accent-ink)]"
              aria-hidden
              strokeWidth={1.75}
            />
          </div>
          <div className="min-w-0">
            <p
              id="notification-permission-title"
              className="text-sm font-semibold text-foreground md:text-base"
            >
              {t.notifications.promptTitle}
            </p>
            <p
              id="notification-permission-desc"
              className="mt-1.5 text-xs leading-relaxed text-muted-foreground md:text-sm"
            >
              {t.notifications.promptBody}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={dismiss}
            className="h-11 px-4 text-sm"
          >
            {t.notifications.promptLater}
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => {
              void accept();
            }}
            className="h-11 px-8 text-sm font-semibold md:min-w-[180px]"
          >
            {busy ? t.notifications.promptWorking : t.notifications.promptAllow}
          </Button>
        </div>
      </div>
    </div>
  );
}
