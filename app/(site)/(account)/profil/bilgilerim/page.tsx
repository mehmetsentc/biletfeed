import { redirect } from 'next/navigation';
import { FollowedEntitiesSection } from '@/components/account/followed-entities-section';
import { PersonalInfoPageClient } from '@/app/(site)/(account)/profil/bilgilerim/personal-info-page-client';
import { verifySessionCookie } from '@/lib/auth/session';
import {
  getFollowedOrganizersByFirebaseUid,
  getFollowedVenuesByFirebaseUid
} from '@/lib/services/follows';

export default async function PersonalInfoPage() {
  const session = await verifySessionCookie();
  if (!session) redirect('/giris?redirect=/profil/bilgilerim');

  const [organizers, venues] = await Promise.all([
    getFollowedOrganizersByFirebaseUid(session.uid),
    getFollowedVenuesByFirebaseUid(session.uid)
  ]);

  return (
    <div className="max-w-5xl">
      <PersonalInfoPageClient />
      <FollowedEntitiesSection organizers={organizers} venues={venues} />
    </div>
  );
}
