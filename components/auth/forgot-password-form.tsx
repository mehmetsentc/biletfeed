'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput
} from '@/lib/validations/auth';
import { getTranslations } from '@/lib/i18n';

const t = getTranslations();

export function ForgotPasswordForm() {
  const { resetPassword, isConfigured } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    if (!isConfigured) {
      setError('Firebase yapılandırması eksik. .env.local dosyasını kontrol edin.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(data.email);
      setSuccess(true);
    } catch {
      setError('Sıfırlama bağlantısı gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">E-posta Gönderildi</CardTitle>
          <CardDescription>{t.auth.resetEmailSent}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/giris">
            <Button variant="outline" className="w-full">
              {t.auth.loginTitle}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t.auth.forgotPasswordTitle}</CardTitle>
        <CardDescription>{t.auth.forgotPasswordSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t.common.loading : t.auth.forgotPasswordButton}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/giris" className="text-primary hover:underline">
            {t.common.back}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
