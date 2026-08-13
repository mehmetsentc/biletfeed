export type NotificationPreferences = {
  email: boolean;
  sms: boolean;
  push: boolean;
  newsletter: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: false,
  sms: false,
  push: false,
  newsletter: false
};

/** Soft prompt kabulünde açılan paket (SMS hariç — telefon gerekir) */
export const ACCEPTED_NOTIFICATION_PACKAGE: NotificationPreferences = {
  email: true,
  sms: false,
  push: true,
  newsletter: true
};

const STORAGE_PREFIX = 'bf-notification-prefs:';
export const GUEST_PREFS_KEY = 'guest';
export const NOTIFICATION_PREFS_EVENT = 'bf-notification-prefs-change';

function storageKey(uid: string) {
  return `${STORAGE_PREFIX}${uid}`;
}

export function loadNotificationPreferences(
  uid: string = GUEST_PREFS_KEY
): NotificationPreferences {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...parsed
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function saveNotificationPreferences(
  uid: string,
  prefs: NotificationPreferences
) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(uid), JSON.stringify(prefs));
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_PREFS_EVENT, {
      detail: { uid, prefs }
    })
  );
}

/** Misafir tercihlerinden giriş sonrası birleştir */
export function mergeGuestPreferencesIntoUser(uid: string): NotificationPreferences {
  const guest = loadNotificationPreferences(GUEST_PREFS_KEY);
  const existing = loadNotificationPreferences(uid);
  const merged: NotificationPreferences = {
    email: existing.email || guest.email,
    sms: existing.sms || guest.sms,
    push: existing.push || guest.push,
    newsletter: existing.newsletter || guest.newsletter
  };
  saveNotificationPreferences(uid, merged);
  return merged;
}
