'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { getRedirectTarget } from '@/components/auth/auth-session-redirect';
import { ensureAuthReady } from '@/lib/firebase/client';
import { establishClientSessionWithRetry } from '@/lib/auth/client-session';
import { redirectFromAuthPagesIfNeeded } from '@/lib/firebase/auth-redirect';
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
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { getTranslations } from '@/lib/i18n';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/auth-errors';

const t = getTranslations();

export function LoginForm() {
  const { signIn, signInWithGoogle, isConfigured } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginInput) => {
    if (!isConfigured) {
      setError('Firebase yapılandırması eksik. .env.local dosyasını kontrol edin.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(data.email, data.password);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err, 'E-posta veya şifre hatalı'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isConfigured) {
      setError('Firebase yapılandırması eksik. .env.local dosyasını kontrol edin.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      const auth = await ensureAuthReady();
      if (auth.currentUser) {
        redirectFromAuthPagesIfNeeded();
        void establishClientSessionWithRetry(auth.currentUser);
        window.location.replace(getRedirectTarget('/giris', searchParams.toString()));
      }
    } catch (err) {
      setError(
        getFirebaseAuthErrorMessage(err, 'Google ile giriş başarısız oldu')
      );
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t.auth.loginTitle}</CardTitle>
        <CardDescription>{t.auth.loginSubtitle}</CardDescription>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Link
                href="/sifremi-unuttum"
                className="text-sm text-primary hover:underline"
              >
                {t.auth.forgotPassword}
              </Link>
            </div>
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t.common.loading : t.auth.loginButton}
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
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
        >
          {t.auth.googleLogin}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t.auth.noAccount}{' '}
          <Link href="/kayit" className="text-primary hover:underline">
            {t.nav.register}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
