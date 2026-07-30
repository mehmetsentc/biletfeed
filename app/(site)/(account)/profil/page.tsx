import { redirect } from 'next/navigation';
import { AccountProfileTabs } from '@/components/account/account-profile-tabs';
import { SettingsPageHeader } from '@/components/account/settings-form';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import { FollowedEntitiesSection } from '@/components/account/followed-entities-section';
import { ProfileInfoForm } from './profile-info-form';
import { verifySessionCookie } from '@/lib/auth/session';
import {
  getFollowedOrganizersByFirebaseUid,
  getFollowedVenuesByFirebaseUid
} from '@/lib/services/follows';

export default async function ProfilePage() {
  const session = await verifySessionCookie();
  if (!session) redirect('/kayit?redirect=/profil');

  const [organizers, venues] = await Promise.all([
    getFollowedOrganizersByFirebaseUid(session.uid),
    getFollowedVenuesByFirebaseUid(session.uid)
  ]);

  return (
    <div className="max-w-5xl">
      <AccountProfileTabs />
      <SettingsPageHeader title="Profilim" />

      <div className="mt-6 flex justify-center md:justify-start">
        <AvatarUpload />
      </div>

      <div className="mt-8">
        <ProfileInfoForm />
      </div>

      <FollowedEntitiesSection organizers={organizers} venues={venues} />
    </div>
  );
}
