'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ToslaCardPaymentForm } from '@/components/payments/tosla-card-payment-form';
import { ToslaHostedFallbackModal } from '@/components/payments/tosla-hosted-fallback-modal';
import type { PaymentPageContext } from '@/lib/services/payment-page';
import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';

export function ToslaPaymentPageClient({ context }: { context: PaymentPageContext }) {
  const [showHostedFallback, setShowHostedFallback] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bf-orange-500/10 via-background to-background">
      <div className="container mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={context.cancelUrl}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Geri
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandAssetUrl(brandLogos.forLightSurface)} alt="BiletFeed" className="h-7 w-auto" />
        </div>

        {context.coverImage && (
          <div className="relative mb-6 h-36 overflow-hidden rounded-2xl">
            <Image
              src={context.coverImage}
              alt={context.eventTitle}
              fill
              className="object-cover"
              sizes="512px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <ToslaCardPaymentForm
          sessionId={context.sessionId}
          processCardFormUrl={context.processCardFormUrl}
          total={context.total}
          eventTitle={context.eventTitle}
          ticketSummary={context.ticketSummary}
          cancelHref={context.cancelUrl}
          onUseHostedFallback={() => setShowHostedFallback(true)}
        />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ödeme işleminiz tamamlandığında otomatik olarak yönlendirileceksiniz.
        </p>
      </div>

      {showHostedFallback && <ToslaHostedFallbackModal hostedPaymentUrl={context.hostedPaymentUrl} />}
    </div>
  );
}
