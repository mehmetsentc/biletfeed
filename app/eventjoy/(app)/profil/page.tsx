import { EventJoyProfilePage } from '@/components/eventjoy/profile-page';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Profil',
  description: 'EventJoy profil ve hesap ayarları.',
  path: '/eventjoy/profil'
});

export default function ProfilePage() {
  return <EventJoyProfilePage />;
}
