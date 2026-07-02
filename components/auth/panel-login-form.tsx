'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
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
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/auth-errors';
import { readStoredGoogleAuthError } from '@/components/auth/google-auth-init';
import { readStoredAppleAuthError } from '@/components/auth/apple-auth-init';
import { AppleSignInButton } from '@/components/auth/apple-sign-in-button';
import { siteHref } from '@/lib/config/domain';

export function PanelLoginForm() {
  const {
    signIn,
    signInWithGoogle,
    signInWithApple,
    isConfigured,
    firebaseUser,
    loading: authLoading,
    sessionError
  } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedError =
      readStoredGoogleAuthError() ?? readStoredAppleAuthError();
    if (storedError) setError(storedError);
  }, []);

  useEffect(() => {
    if (sessionError) setError(sessionError);
  }, [sessionError]);

  const showLoginForm = !authLoading && !firebaseUser;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginInput) => {
    if (!isConfigured) {
      setError('Firebase yapılandırması eksik.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(data.email, data.password);
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err, 'E-posta veya şifre hatalı'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isConfigured) {
      setError('Firebase yapılandırması eksik.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      if (result.mode === 'redirect') return;
    } catch (err) {
      setError(
        getFirebaseAuthErrorMessage(err, 'Google ile giriş başarısız oldu')
      );
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (!isConfigured) {
      setError('Firebase yapılandırması eksik.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithApple();
      if (result.mode === 'redirect') return;
    } catch (err) {
      setError(
        getFirebaseAuthErrorMessage(err, 'Apple ile giriş başarısız oldu', 'apple')
      );
      setLoading(false);
    }
  };

  const socialInProgress = loading && !error;

  if (!showLoginForm) return null;

  return (
    <Card className="w-full max-w-md border-white/10 bg-[#151a24] text-white">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Organizatör Girişi</CardTitle>
        <CardDescription className="text-white/60">
          BiletFeed hesabınızla panele giriş yapın
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/20 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="panel-email">E-posta</Label>
            <Input
              id="panel-email"
              type="email"
              placeholder="ornek@email.com"
              className="border-white/15 bg-[#0c1017] text-white"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-red-300">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="panel-password">Şifre</Label>
              <Link
                href="/sifremi-unuttum"
                className="text-sm text-[#f5a623] hover:underline"
              >
                Şifremi unuttum
              </Link>
            </div>
            <Input
              id="panel-password"
              type="password"
              className="border-white/15 bg-[#0c1017] text-white"
              {...register('password')}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-sm text-red-300">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-[#f5a623] text-black hover:bg-[#e09510]"
            disabled={loading}
          >
            {loading ? 'Giriş yapılıyor...' : 'Panele giriş yap'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/15" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#151a24] px-2 text-white/50">veya</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
          onClick={handleGoogleLogin}
          disabled={socialInProgress}
          type="button"
        >
          {socialInProgress ? 'Google ile giriş yapılıyor…' : 'Google ile giriş yap'}
        </Button>

        <AppleSignInButton
          label="Apple ile giriş yap"
          loadingLabel="Apple ile giriş yapılıyor…"
          loading={socialInProgress}
          onClick={handleAppleLogin}
          className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
        />

        <p className="text-center text-sm text-white/50">
          Bilet almak için{' '}
          <Link
            href={siteHref('/giris')}
            className="text-[#f5a623] hover:underline"
          >
            ana siteye giriş yapın
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
