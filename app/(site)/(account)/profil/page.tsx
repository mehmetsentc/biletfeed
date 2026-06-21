'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  SettingsField,
  SettingsPageHeader,
  SettingsSaveBar,
  SettingsSection
} from '@/components/account/settings-form';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import { useAuth } from '@/components/providers/auth-provider';

function splitDisplayName(displayName?: string) {
  if (!displayName?.trim()) {
    return { firstName: '', lastName: '' };
  }
  const parts = displayName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ')
  };
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [saved, setSaved] = useState(false);
  const names = useMemo(
    () => splitDisplayName(user?.displayName),
    [user?.displayName]
  );

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <SettingsPageHeader title="Hesap Bilgileri" />

      <SettingsSection title="Profil Fotoğrafı">
        <AvatarUpload />
      </SettingsSection>

      <SettingsSection title="Profil Bilgileri">
        <SettingsField label="Ad">
          <Input
            key={`first-${user?.uid ?? 'guest'}`}
            placeholder="Adınızı girin"
            defaultValue={names.firstName}
            className="h-11 md:h-10"
          />
        </SettingsField>
        <SettingsField label="Soyad">
          <Input
            key={`last-${user?.uid ?? 'guest'}`}
            placeholder="Soyadınızı girin"
            defaultValue={names.lastName}
            className="h-11 md:h-10"
          />
        </SettingsField>
        <SettingsField label="Web Sitesi">
          <Input placeholder="https://..." className="h-11 md:h-10" />
        </SettingsField>
        <SettingsField label="Şirket">
          <Input placeholder="Şirket adını girin" className="h-11 md:h-10" />
        </SettingsField>
      </SettingsSection>

      <SettingsSection
        title="İletişim Bilgileri"
        description="Bu bilgiler gizlidir ve yalnızca bilet veya ödül bildirimleri için kullanılır."
      >
        <SettingsField label="Telefon Numarası">
          <Input
            placeholder="Telefon numaranızı girin"
            className="h-11 md:h-10"
          />
        </SettingsField>
        <SettingsField label="Adres" className="md:items-start">
          <textarea
            placeholder="Adresinizi girin"
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
          />
        </SettingsField>
        <SettingsField label="Şehir / İlçe">
          <Input placeholder="Şehir girin" className="h-11 md:h-10" />
        </SettingsField>
        <SettingsField label="Ülke">
          <Input placeholder="Ülke girin" className="h-11 md:h-10" />
        </SettingsField>
        <SettingsField label="Posta Kodu">
          <Input placeholder="Posta kodunu girin" className="h-11 md:h-10" />
        </SettingsField>
      </SettingsSection>

      <SettingsSaveBar
        label="Profilimi Kaydet"
        saved={saved}
        onClick={handleSave}
      />
    </div>
  );
}
