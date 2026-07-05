'use client';

/** EventJoy — hesap türü ayrımı kaldırıldı; tüm giriş yapmış kullanıcılar erişebilir. */
export function EventJoyUserGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
