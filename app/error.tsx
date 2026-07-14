'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/config/site';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Logo variant="auto" className="mb-10" />
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Bir şeyler ters gitti</h1>
      <p className="mt-2 max-w-md text-center text-muted-foreground">
        Beklenmedik bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset} className="gap-2 rounded-full">
          <RefreshCw className="size-4" />
          Tekrar Dene
        </Button>
        <Link href="/">
          <Button variant="outline" className="gap-2 rounded-full">
            <Home className="size-4" />
            Ana Sayfa
          </Button>
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-muted-foreground/60">
          Hata kodu: {error.digest}
        </p>
      )}
      <p className="mt-10 text-sm text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name}
      </p>
    </div>
  );
}
