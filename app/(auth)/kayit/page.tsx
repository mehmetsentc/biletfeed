import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import { AuthShell } from '@/components/auth/auth-shell';
import { getServerTranslations } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t.auth.registerTitle,
    description: t.auth.registerSubtitle
  };
}

export default async function RegisterPage() {
  const { t } = await getServerTranslations();

  return (
    <AuthShell
      title={t.auth.registerShellTitle}
      subtitle={t.auth.registerShellSubtitle}
      bullets={[t.auth.shellBullet1, t.auth.shellBullet2, t.auth.shellBullet3]}
      backHomeLabel={t.auth.shellBackHome}
    >
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
