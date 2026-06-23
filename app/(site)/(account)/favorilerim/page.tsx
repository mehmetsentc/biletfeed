import { MyFavoritesPageClient } from '@/components/account/my-favorites-page-client';
import {
  getFavoriteEventsByFirebaseUid,
  getFavoriteVenuesByFirebaseUid,
  getFollowedOrganizersByFirebaseUid
} from '@/lib/services/favorites';
import { verifySessionCookie } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Favorilerim',
  path: '/favorilerim'
});

export default async function FavoritesPage() {
  const session = await verifySessionCookie();
  if (!session) redirect('/giris?redirect=/favorilerim');

  const [events, artists, venues] = await Promise.all([
    getFavoriteEventsByFirebaseUid(session.uid),
    getFollowedOrganizersByFirebaseUid(session.uid),
    getFavoriteVenuesByFirebaseUid(session.uid)
  ]);

  return (
    <MyFavoritesPageClient events={events} artists={artists} venues={venues} />
  );
}
