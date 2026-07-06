'use client';

import { useEffect } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

/** Tosla ortak ödeme sayfasına tam sayfa yönlendirme (iframe X-Frame-Options ile engellenir). */
export function ToslaHostedFallbackModal({ hostedPaymentUrl }: { hostedPaymentUrl: string }) {
  useEffect(() => {
    window.location.assign(hostedPaymentUrl);
  }, [hostedPaymentUrl]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 p-6 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="size-7 text-primary" />
        </div>
        <Loader2 className="mb-4 size-8 animate-spin text-primary" />
        <p className="text-lg font-bold text-foreground">Tosla güvenli ödeme sayfasına yönlendiriliyorsunuz</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Birkaç saniye içinde otomatik olarak yönlendirileceksiniz. Sayfa açılmazsa{' '}
          <a href={hostedPaymentUrl} className="font-medium text-primary underline-offset-2 hover:underline">
            buraya tıklayın
          </a>
          .
        </p>
      </div>
    </div>
  );
}
