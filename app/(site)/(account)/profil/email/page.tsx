'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  SettingsField,
  SettingsPageHeader,
  SettingsSaveBar,
  SettingsSection
} from '@/components/account/settings-form';
import { useAuth } from '@/components/providers/auth-provider';

export default function ChangeEmailPage() {
  const { user, loading } = useAuth();
  const [saved, setSaved] = useState(false);

  if (loading) {
    return (
      <div className="max-w-3xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <SettingsPageHeader
        title="E-posta Değiştir"
        description="Yeni e-posta adresinize doğrulama bağlantısı gönderilecektir."
      />

      <SettingsSection title="E-posta">
        <SettingsField label="Mevcut e-posta">
          <Input
            value={user?.email ?? ''}
            disabled
            placeholder="E-posta adresiniz"
            className="h-11 md:h-10"
          />
        </SettingsField>
        <SettingsField label="Yeni e-posta">
          <Input type="email" placeholder="yeni@email.com" className="h-11 md:h-10" />
        </SettingsField>
        <SettingsField label="Şifre onayı">
          <Input type="password" placeholder="••••••••" className="h-11 md:h-10" />
        </SettingsField>
      </SettingsSection>

      <SettingsSaveBar
        label="E-postayı Güncelle"
        saved={saved}
        onClick={() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
      />
    </div>
  );
}
