import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { AuthShell } from '@/components/auth/auth-shell';
import { getTranslations } from '@/lib/i18n';

const t = getTranslations();

export const metadata: Metadata = {
  title: t.auth.loginTitle,
  description: t.auth.loginSubtitle
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Harika etkinlikleri kaçırmayın"
      subtitle="Yerel ve global etkinlikleri keşfedin, biletinizi güvenle alın."
    >
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
