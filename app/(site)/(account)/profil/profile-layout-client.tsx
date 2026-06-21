'use client';

import { usePathname } from 'next/navigation';
import { AccountSettingsShell } from '@/components/account/account-settings-shell';

export function ProfileLayoutClient({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isInterests = pathname === '/profil/ilgi-alanlari';

  if (isInterests) {
    return <>{children}</>;
  }

  return <AccountSettingsShell>{children}</AccountSettingsShell>;
}
