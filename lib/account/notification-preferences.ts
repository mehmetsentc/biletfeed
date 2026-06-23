export type NotificationPreferences = {
  email: boolean;
  sms: boolean;
  newsletter: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: false,
  sms: false,
  newsletter: false
};

const STORAGE_PREFIX = 'bf-notification-prefs:';

export function loadNotificationPreferences(
  uid: string
): NotificationPreferences {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${uid}`);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...JSON.parse(raw)
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
  localStorage.setItem(`${STORAGE_PREFIX}${uid}`, JSON.stringify(prefs));
}
