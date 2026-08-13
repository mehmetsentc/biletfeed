'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import type { IyzicoPaymentPageContext } from '@/lib/services/payment-page';
import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';
import { PaymentCardLogos } from '@/components/checkout/payment-card-logos';
import { Button } from '@/components/ui/button';

function formatTry(amount: number): string {
  return `${amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ₺`;
}

/**
 * BiletFeed markalı ödeme kabuğu — kart alanları İyzico iframe içinde kalır (PCI).
 * Önde sipariş özeti + marka; arkada İyzico Checkout Form çalışır.
 */
export function IyzicoCheckoutPageClient({
  context
}: {
  context: IyzicoPaymentPageContext;
}) {
  return (
    <div className="min-h-screen bg-[var(--bf-bg)] text-foreground">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.4]"
        style={{
          background:
            'radial-gradient(ellipse 90% 45% at 50% -15%, color-mix(in srgb, var(--bf-neon) 22%, transparent), transparent)'
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-lg px-4 pb-16 pt-6 sm:max-w-xl sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href={context.cancelUrl}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Geri
          </Link>
          <Image
            src={brandAssetUrl(brandLogos.forLightSurface)}
            alt="BiletFeed"
            width={120}
            height={36}
            className="h-7 w-auto dark:hidden"
            priority
          />
          <Image
            src={brandAssetUrl(brandLogos.forDarkSurface)}
            alt="BiletFeed"
            width={120}
            height={36}
            className="hidden h-7 w-auto dark:block"
            priority
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
          {context.coverImage ? (
            <div className="relative h-36 w-full sm:h-40">
              <Image
                src={context.coverImage}
                alt={context.eventTitle}
                fill
                className="object-cover object-center"
                sizes="(max-width: 640px) 100vw, 576px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  Güvenli ödeme
                </p>
                <h1 className="mt-1 line-clamp-2 text-lg font-extrabold text-white sm:text-xl">
                  {context.eventTitle}
                </h1>
              </div>
            </div>
          ) : (
            <div className="border-b border-border px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--bf-accent-ink)]">
                Güvenli ödeme
              </p>
              <h1 className="mt-1 text-lg font-extrabold sm:text-xl">
                {context.eventTitle}
              </h1>
            </div>
          )}

          <div className="space-y-4 px-4 py-5 sm:px-5">
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/80 bg-muted/40 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Sipariş</p>
                <p className="mt-0.5 truncate text-sm font-semibold">
                  {context.ticketSummary || 'Bilet'}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-muted-foreground">Toplam</p>
                <p className="mt-0.5 text-xl font-extrabold tracking-tight text-[var(--bf-accent-ink)]">
                  {formatTry(context.total)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-primary/10 px-3 py-2.5 text-xs leading-relaxed text-foreground/90">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-[var(--bf-accent-ink)]" aria-hidden />
              <span>
                Kart bilgileriniz BiletFeed’de saklanmaz. Ödeme, İyzico güvenli altyapısı üzerinden
                tamamlanır.
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-white">
              <iframe
                title="İyzico güvenli ödeme formu"
                src={context.iframeUrl}
                className="h-[min(72vh,680px)] w-full border-0"
                allow="payment *"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>

            <div className="flex flex-col items-center gap-3 pt-1">
              <PaymentCardLogos className="justify-center opacity-90" />
              <p className="inline-flex items-center gap-1.5 text-center text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3.5 text-[var(--bf-accent-ink)]" aria-hidden />
                SSL/TLS · 3D Secure · İyzico
              </p>
            </div>

            <Button variant="outline" className="h-11 w-full rounded-xl text-sm" asChild>
              <a href={context.hostedPaymentUrl} target="_blank" rel="noopener noreferrer">
                Ödeme ekranını yeni sekmede aç
              </a>
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ödeme onaylandığında biletlerinize otomatik yönlendirilirsiniz.
        </p>
      </div>
    </div>
  );
}
