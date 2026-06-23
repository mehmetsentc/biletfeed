import { Suspense } from 'react';
import { SettingsPageClient } from '@/components/account/settings-page-client';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Ayarlar',
  path: '/profil/ayarlar'
});

export default function SettingsHubPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" />}>
      <SettingsPageClient />
    </Suspense>
  );
}
