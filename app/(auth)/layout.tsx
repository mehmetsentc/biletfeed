import { Suspense } from 'react';
import { AuthSessionRedirect } from '@/components/auth/auth-session-redirect';
import { GoogleAuthInit } from '@/components/auth/google-auth-init';
import { AppleAuthInit } from '@/components/auth/apple-auth-init';

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GoogleAuthInit />
      <AppleAuthInit />
      <Suspense fallback={null}>
        <AuthSessionRedirect />
      </Suspense>
      {children}
    </>
  );
}
