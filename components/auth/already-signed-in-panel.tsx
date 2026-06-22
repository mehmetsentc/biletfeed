'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { getRedirectTarget } from '@/components/auth/auth-session-redirect';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export function AlreadySignedInPanel() {
  const {
    firebaseUser,
    sessionReady,
    sessionError,
    loading,
    syncSession,
    signOut
  } = useAuth();
  const searchParams = useSearchParams();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !firebaseUser) return null;

  const target = getRedirectTarget('/giris', searchParams.toString());
  const email = firebaseUser.email || firebaseUser.displayName || 'Hesabınız';
  const queryError = searchParams.get('error');
  const displayError =
    error ||
    sessionError ||
    (queryError === 'admin_required'
      ? 'Bu hesabın admin yetkisi yok. Süperadmin ataması için site yöneticisine başvurun.'
      : null);

  async function continueToTarget() {
    setSyncing(true);
    setError(null);

    const mustRefreshSession =
      queryError === 'admin_required' || !sessionReady;

    if (mustRefreshSession) {
      const ok = await syncSession();
      if (!ok) {
        setSyncing(false);
        return;
      }
    }

    window.location.replace(target);
  }

  return (
    <Card className="mb-4 w-full max-w-md border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Zaten giriş yaptınız</CardTitle>
        <CardDescription>{email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayError && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {displayError}
          </p>
        )}
        <Button
          className="w-full"
          onClick={() => void continueToTarget()}
          disabled={syncing}
        >
          {syncing
            ? 'Oturum hazırlanıyor...'
            : target === '/admin'
              ? 'Admin paneline devam et'
              : 'Devam et'}
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => void signOut()}
          disabled={syncing}
        >
          Farklı hesapla giriş yap
        </Button>
      </CardContent>
    </Card>
  );
}
