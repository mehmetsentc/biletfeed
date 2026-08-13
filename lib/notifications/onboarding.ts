/**
 * İlk açılış bildirim onboarding durumu (cihaz bazlı).
 * Cookie onayından sonra soft prompt gösterilir.
 */

export type NotificationOnboardingStatus = 'pending' | 'accepted' | 'dismissed';

export const NOTIFICATION_ONBOARDING_KEY = 'bf_notification_onboarding';
export const NOTIFICATION_ONBOARDING_EVENT = 'bf-notification-onboarding-change';

export function readNotificationOnboarding(): NotificationOnboardingStatus {
  if (typeof window === 'undefined') return 'pending';
  try {
    const raw = localStorage.getItem(NOTIFICATION_ONBOARDING_KEY);
    if (raw === 'accepted' || raw === 'dismissed') return raw;
  } catch {
    // ignore
  }
  return 'pending';
}

export function saveNotificationOnboarding(status: 'accepted' | 'dismissed') {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATION_ONBOARDING_KEY, status);
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_ONBOARDING_EVENT, { detail: { status } })
  );
}
