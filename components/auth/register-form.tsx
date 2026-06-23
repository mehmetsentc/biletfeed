'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { getTranslations } from '@/lib/i18n';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/auth-errors';
import { readStoredGoogleAuthError } from '@/components/auth/google-auth-init';

const t = getTranslations();

export function RegisterForm() {
  const { signUp, signInWithGoogle, isConfigured, sessionError } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedError = readStoredGoogleAuthError();
    if (storedError) setError(storedError);
  }, []);

  useEffect(() => {
    if (sessionError) setError(sessionError);
  }, [sessionError]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterInput) => {
    if (!isConfigured) {
      setError('Firebase yapılandırması eksik. .env.local dosyasını kontrol edin.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signUp(data.email, data.password, data.displayName);
      router.push('/ilgi-alanlari');
      router.refresh();
    } catch (err) {
      setError(
        getFirebaseAuthErrorMessage(
          err,
          'Kayıt işlemi başarısız oldu. E-posta zaten kullanımda olabilir.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (!isConfigured) {
      setError('Firebase yapılandırması eksik. .env.local dosyasını kontrol edin.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      if (result.mode === 'redirect') return;
      setLoading(false);
    } catch (err) {
      setError(
        getFirebaseAuthErrorMessage(err, 'Google ile kayıt başarısız oldu')
      );
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t.auth.registerTitle}</CardTitle>
        <CardDescription>{t.auth.registerSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">{t.auth.displayName}</Label>
            <Input
              id="displayName"
              {...register('displayName')}
              aria-invalid={!!errors.displayName}
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">
                {errors.displayName.message}
              </p>
            )}
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t.common.loading : t.auth.registerButton}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t.common.or}</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleRegister}
          disabled={loading}
          type="button"
        >
          {t.auth.googleRegister}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t.auth.hasAccount}{' '}
          <Link href="/giris" className="text-primary hover:underline">
            {t.nav.login}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
