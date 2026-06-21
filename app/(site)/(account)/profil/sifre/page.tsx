'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  SettingsField,
  SettingsPageHeader,
  SettingsSaveBar,
  SettingsSection
} from '@/components/account/settings-form';

export default function ChangePasswordPage() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="mx-auto max-w-3xl">
      <SettingsPageHeader
        title="Şifre"
        description="Güçlü bir şifre kullanın (en az 8 karakter)."
      />

      <SettingsSection title="Şifre Değiştir">
        <SettingsField label="Mevcut şifre">
          <Input type="password" className="h-11 md:h-10" />
        </SettingsField>
        <SettingsField label="Yeni şifre">
          <Input type="password" className="h-11 md:h-10" />
        </SettingsField>
        <SettingsField label="Yeni şifre (tekrar)">
          <Input type="password" className="h-11 md:h-10" />
        </SettingsField>
      </SettingsSection>

      <SettingsSaveBar
        label="Şifreyi Güncelle"
        saved={saved}
        onClick={() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
      />
    </div>
  );
}
