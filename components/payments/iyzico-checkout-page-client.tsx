'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { PaymentCardLogos } from '@/components/checkout/payment-card-logos';
import type { IyzicoPaymentPageContext } from '@/lib/services/payment-page';
import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';

function formatTry(amount: number): string {
  return `${amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ₺`;
}

/**
 * BiletFeed markalı ödeme kabuğu.
 * Kart alanları İyzico iframe’inde (PCI); tema yalnızca kabuk + güven şeridinde.
 */
export function IyzicoCheckoutPageClient({
  context
}: {
  context: IyzicoPaymentPageContext;
}) {
  const [iframeReady, setIframeReady] = useState(false);

  const hostedIframe =
    context.iframeUrl.startsWith('http://') ||
    context.iframeUrl.startsWith('https://');
  const useSrcDoc =
    !hostedIframe && Boolean(context.checkoutFormHtml?.trim());

  useEffect(() => {
    if (useSrcDoc) {
      const t = window.setTimeout(() => setIframeReady(true), 120);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setIframeReady(true), 2500);
    return () => window.clearTimeout(t);
  }, [useSrcDoc]);

  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#050505] text-white">
      {context.coverImage ? (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <Image
            src={context.coverImage}
            alt=""
            fill
            className="object-cover opacity-[0.18] blur-2xl scale-110"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/70 via-[#050505]/92 to-[#050505]" />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(223,255,0,0.07),_transparent_50%)]"
          aria-hidden
        />
      )}

      <div className="relative mx-auto flex h-full w-full max-w-[440px] flex-col sm:max-w-[480px]">
        <header className="shrink-0 px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="flex h-12 items-center justify-between gap-3">
            <Link
              href={context.cancelUrl}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Geri"
            >
              <ArrowLeft className="size-5" aria-hidden />
            </Link>

            <Image
              src={brandAssetUrl(brandLogos.forDarkSurface)}
              alt="BiletFeed"
              width={110}
              height={32}
              className="h-6 w-auto"
              priority
            />

            <p className="min-w-[4.75rem] text-right text-sm font-extrabold tabular-nums tracking-tight text-[var(--bf-neon)]">
              {formatTry(context.total)}
            </p>
          </div>

          <div className="mt-1 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 backdrop-blur-sm">
            {context.coverImage ? (
              <div className="relative size-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15">
                <Image
                  src={context.coverImage}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="44px"
                  priority
                />
              </div>
            ) : (
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--bf-neon)]/10 ring-1 ring-[var(--bf-neon)]/25">
                <Lock className="size-4 text-[var(--bf-neon)]" aria-hidden />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">
                {context.eventTitle}
              </p>
              <p className="truncate text-xs text-white/50">
                {context.ticketSummary || 'Bilet'}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--bf-neon)]/25 bg-[var(--bf-neon)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--bf-neon)]">
              <ShieldCheck className="size-3" aria-hidden />
              3DS
            </span>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col justify-start px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:justify-center sm:px-4">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0b0b0b] shadow-[0_0_0_1px_rgba(223,255,0,0.12),0_20px_50px_rgba(0,0,0,0.55)] sm:h-[min(640px,calc(100dvh-13rem))] sm:flex-none">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#111] px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bf-neon)] text-[#050505]">
                  <Lock className="size-3.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    Güvenli ödeme
                  </p>
                  <p className="truncate text-[10px] text-white/45">
                    Kart · İyzico altyapısı
                  </p>
                </div>
              </div>
              <PaymentCardLogos
                className="hidden gap-1.5 sm:flex"
                logoClassName="brightness-110"
              />
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
              {!iframeReady && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0b0b0b] px-6">
                  <div className="size-8 animate-spin rounded-full border-2 border-white/15 border-t-[var(--bf-neon)]" />
                  <p className="text-center text-xs text-white/50">
                    Güvenli ödeme formu yükleniyor…
                  </p>
                </div>
              )}
              {useSrcDoc ? (
                <iframe
                  title="İyzico güvenli ödeme formu"
                  srcDoc={context.checkoutFormHtml ?? undefined}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="payment *"
                  referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={() => setIframeReady(true)}
                />
              ) : (
                <iframe
                  title="İyzico güvenli ödeme formu"
                  src={context.iframeUrl}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="payment *"
                  referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={() => setIframeReady(true)}
                />
              )}
            </div>
          </div>

          <div className="shrink-0 space-y-2 pt-3">
            <div className="flex justify-center sm:hidden">
              <PaymentCardLogos className="justify-center gap-2 opacity-90" />
            </div>
            <p className="text-center text-[11px] leading-snug text-white/40">
              Kart bilgileriniz BiletFeed’de saklanmaz · SSL · 3D Secure
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
