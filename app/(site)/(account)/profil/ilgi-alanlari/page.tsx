import { createPageMetadata } from '@/lib/seo/metadata';
import ProfileInterestsPage from './page-client';

export const metadata = createPageMetadata({
  title: 'İlgi Alanları',
  path: '/profil/ilgi-alanlari'
});

export default function Page() {
  return <ProfileInterestsPage />;
}
