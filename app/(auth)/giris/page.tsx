import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { AlreadySignedInPanel } from '@/components/auth/already-signed-in-panel';
import { AuthShell } from '@/components/auth/auth-shell';
import { getServerTranslations } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t.auth.loginTitle,
    description: t.auth.loginSubtitle
  };
}

export default async function LoginPage() {
  const { t } = await getServerTranslations();

  return (
    <AuthShell
      title={t.auth.loginShellTitle}
      subtitle={t.auth.loginShellSubtitle}
      bullets={[t.auth.shellBullet1, t.auth.shellBullet2, t.auth.shellBullet3]}
      backHomeLabel={t.auth.shellBackHome}
    >
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <div className="flex w-full max-w-md flex-col items-center">
          <AlreadySignedInPanel />
          <LoginForm />
        </div>
      </Suspense>
    </AuthShell>
  );
}
