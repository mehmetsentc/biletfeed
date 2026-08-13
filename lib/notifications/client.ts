/**
 * Tarayıcı Notification API + FCM web token (opsiyonel VAPID).
 * Native Capacitor Push: `@capacitor/push-notifications` eklendiğinde
 * ayrı native kayıt akışı mobile kabuğundan bağlanır.
 */

export type PushPlatform = 'web' | 'ios' | 'android';

export type PermissionRequestResult = {
  permission: NotificationPermission | 'unsupported';
  granted: boolean;
  token: string | null;
  platform: PushPlatform;
};

function detectPlatform(): PushPlatform {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'web';
}

async function tryWebPushToken(): Promise<string | null> {
  const vapid = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  if (!vapid || typeof window === 'undefined') return null;

  try {
    const { getApps, getApp } = await import('firebase/app');
    const { getMessaging, getToken, isSupported } = await import(
      'firebase/messaging'
    );
    if (!(await isSupported())) return null;
    if (!getApps().length) return null;

    const messaging = getMessaging(getApp());
    const token = await getToken(messaging, { vapidKey: vapid });
    return token || null;
  } catch {
    return null;
  }
}

/** Soft prompt sonrası OS izni + token */
export async function requestNotificationPermission(): Promise<PermissionRequestResult> {
  const platform = detectPlatform();

  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return {
      permission: 'unsupported',
      granted: false,
      token: null,
      platform
    };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  const granted = permission === 'granted';
  const token = granted ? await tryWebPushToken() : null;

  return { permission, granted, token, platform };
}

export async function syncPreferencesToServer(
  prefs: {
    email: boolean;
    sms: boolean;
    push: boolean;
    newsletter: boolean;
  },
  options?: { subscribeNewsletter?: boolean }
): Promise<boolean> {
  try {
    const res = await fetch('/api/account/notification-preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        ...prefs,
        subscribeNewsletter: options?.subscribeNewsletter ?? prefs.newsletter
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function registerPushTokenOnServer(
  token: string,
  platform: PushPlatform
): Promise<boolean> {
  try {
    const res = await fetch('/api/account/push-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        token,
        platform,
        userAgent:
          typeof navigator !== 'undefined'
            ? navigator.userAgent.slice(0, 300)
            : undefined
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}
