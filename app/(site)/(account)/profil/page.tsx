'use client';

import {
  SettingsPageHeader,
  SettingsSection
} from '@/components/account/settings-form';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import { useAuth } from '@/components/providers/auth-provider';
import { AccountProfileTabs } from '@/components/account/account-profile-tabs';

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl">
      <AccountProfileTabs />
      <SettingsPageHeader title="Profilim" />

      <SettingsSection title="Profil Fotoğrafı">
        <AvatarUpload />
      </SettingsSection>
    </div>
  );
}
