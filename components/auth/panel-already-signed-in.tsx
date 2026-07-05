'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { getPanelRedirectTarget } from '@/components/auth/panel-auth-redirect';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export function PanelAlreadySignedIn() {
  const {
    firebaseUser,
    sessionReady,
    sessionError,
    loading,
    syncSession,
    signOutPanel
  } = useAuth();
  const searchParams = useSearchParams();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !firebaseUser) return null;

  const target = getPanelRedirectTarget(searchParams.toString());
  const email = firebaseUser.email || firebaseUser.displayName || 'Hesabınız';
  const displayError = error || sessionError;

  async function continueToPanel() {
    setSyncing(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/panel-me', {
        credentials: 'same-origin',
        cache: 'no-store'
      });
      if (res.ok) {
        window.location.replace(target);
        return;
      }
    } catch {
      // syncSession ile devam
    }

    if (!sessionReady) {
      const ok = await syncSession();
      if (!ok) {
        setSyncing(false);
        return;
      }
    }

    window.location.replace(target);
  }

  return (
    <Card className="mb-4 w-full max-w-md border-[var(--bf-orange-border)] bg-[#151a24] text-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Panele giriş yapıldı</CardTitle>
        <CardDescription className="text-white/60">{email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayError && (
          <p className="rounded-md bg-destructive/20 p-3 text-sm text-red-300">
            {displayError}
          </p>
        )}
        <Button
          className="w-full bg-primary text-black hover:bg-[var(--bf-orange-hover)]"
          onClick={() => void continueToPanel()}
          disabled={syncing}
        >
          {syncing ? 'Oturum hazırlanıyor...' : 'Panele devam et'}
        </Button>
        <Button
          variant="outline"
          className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
          onClick={() => void signOutPanel()}
          disabled={syncing}
        >
          Farklı hesapla giriş yap
        </Button>
      </CardContent>
    </Card>
  );
}
