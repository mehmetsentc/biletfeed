import { NotificationsPageClient } from '@/components/account/notifications-page-client';
import { SettingsPageHeader } from '@/components/account/settings-form';
import { getNotificationsByUser } from '@/lib/services/tickets';
import { verifySessionCookie } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createPageMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export const metadata = createPageMetadata({
  title: 'Bildirimler',
  path: '/bildirimler'
});

export default async function NotificationsPage() {
  const session = await verifySessionCookie();
  if (!session) redirect('/giris?redirect=/bildirimler');

  const notifications = await getNotificationsByUser(session.uid);

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Bildirimler"
        description="Hesap ve etkinlik güncellemeleri"
      />
      <NotificationsPageClient
        userId={session.uid}
        initialNotifications={notifications}
      />
    </div>
  );
}
