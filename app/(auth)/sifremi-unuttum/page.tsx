import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { AuthShell } from '@/components/auth/auth-shell';
import { getTranslations } from '@/lib/i18n';

const t = getTranslations();

export const metadata: Metadata = {
  title: t.auth.forgotPasswordTitle,
  description: t.auth.forgotPasswordSubtitle
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Hesabınıza tekrar erişin"
      subtitle="E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
