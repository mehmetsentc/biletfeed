import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import { AuthShell } from '@/components/auth/auth-shell';
import { getTranslations } from '@/lib/i18n';

const t = getTranslations();

export const metadata: Metadata = {
  title: t.auth.registerTitle,
  description: t.auth.registerSubtitle
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Size özel etkinlikler"
      subtitle="Hesap oluşturun, ilgi alanlarınızı seçin ve kişiselleştirilmiş öneriler alın."
    >
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
