import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { AuthShell } from '@/components/auth/auth-shell';
import { getServerTranslations } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t.auth.forgotPasswordTitle,
    description: t.auth.forgotPasswordSubtitle
  };
}

export default async function ForgotPasswordPage() {
  const { t } = await getServerTranslations();

  return (
    <AuthShell
      title={t.auth.forgotShellTitle}
      subtitle={t.auth.forgotShellSubtitle}
      bullets={[t.auth.shellBullet1, t.auth.shellBullet2, t.auth.shellBullet3]}
      backHomeLabel={t.auth.shellBackHome}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
