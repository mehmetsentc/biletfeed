import { ProfileLayoutClient } from './profile-layout-client';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Hesap Ayarları',
  path: '/profil'
});

export default function ProfileSettingsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <ProfileLayoutClient>{children}</ProfileLayoutClient>;
}
