'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import {
  mergeGuestPreferencesIntoUser,
  saveNotificationPreferences,
  type NotificationPreferences
} from '@/lib/account/notification-preferences';
import { readNotificationOnboarding } from '@/lib/notifications/onboarding';
import {
  registerPushTokenOnServer,
  requestNotificationPermission,
  syncPreferencesToServer
} from '@/lib/notifications/client';

/**
 * Giriş sonrası: misafir tercihlerini birleştir, sunucuya yaz,
 * kabul edilmiş onboarding’de push token’ı yenile.
 */
export function NotificationPrefsSync() {
  const { user } = useAuth();
  const syncedUid = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      syncedUid.current = null;
      return;
    }
    if (syncedUid.current === user.uid) return;
    syncedUid.current = user.uid;

    void (async () => {
      const merged = mergeGuestPreferencesIntoUser(user.uid);

      // Sunucudan çek; yoksa birleşik yerel tercihleri gönder
      try {
        const res = await fetch('/api/account/notification-preferences', {
          credentials: 'same-origin'
        });
        if (res.ok) {
          const data = (await res.json()) as { prefs: NotificationPreferences };
          const server = data.prefs;
          const anyLocal =
            merged.email || merged.sms || merged.push || merged.newsletter;
          const anyServer =
            server.email || server.sms || server.push || server.newsletter;

          if (anyLocal && !anyServer) {
            await syncPreferencesToServer(merged, {
              subscribeNewsletter: merged.newsletter
            });
            saveNotificationPreferences(user.uid, merged);
          } else {
            const combined: NotificationPreferences = {
              email: server.email || merged.email,
              sms: server.sms || merged.sms,
              push: server.push || merged.push,
              newsletter: server.newsletter || merged.newsletter
            };
            saveNotificationPreferences(user.uid, combined);
            if (
              combined.email !== server.email ||
              combined.push !== server.push ||
              combined.newsletter !== server.newsletter ||
              combined.sms !== server.sms
            ) {
              await syncPreferencesToServer(combined, {
                subscribeNewsletter: combined.newsletter
              });
            }
          }
        } else if (res.status === 401) {
          // oturum cookie henüz yok
        } else {
          await syncPreferencesToServer(merged, {
            subscribeNewsletter: merged.newsletter
          });
        }
      } catch {
        // ignore
      }

      if (
        readNotificationOnboarding() === 'accepted' &&
        (merged.push ||
          (typeof Notification !== 'undefined' &&
            Notification.permission === 'granted'))
      ) {
        const result = await requestNotificationPermission();
        if (result.granted && result.token) {
          await registerPushTokenOnServer(result.token, result.platform);
        }
      }
    })();
  }, [user?.uid]);

  return null;
}
