import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { SettingsPageHeader } from '@/components/account/settings-form';
import { mockNotifications } from '@/lib/data/mock-user';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Bildirimler',
  path: '/bildirimler'
});

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Bildirimler"
        description="Hesap ve etkinlik güncellemeleri"
      />

      <div className="space-y-3">
        {mockNotifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-xl border p-4 ${
              !n.read ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              </div>
              {!n.read && (
                <Badge variant="default" className="shrink-0">
                  Yeni
                </Badge>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{n.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
