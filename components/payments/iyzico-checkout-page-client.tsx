'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Lock, ShieldCheck } from 'lucide-react';
import type { IyzicoPaymentPageContext } from '@/lib/services/payment-page';
import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';
import { PaymentCardLogos } from '@/components/checkout/payment-card-logos';
import { cn } from '@/lib/utils';

function formatTry(amount: number): string {
  return `${amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ₺`;
}

/**
 * Sabit viewport kabuğu: üstte kompakt BiletFeed markası + sipariş,
 * kalan alan İyzico formu (iç scroll). Sayfa kaydırması yok.
 */
export function IyzicoCheckoutPageClient({
  context
}: {
  context: IyzicoPaymentPageContext;
}) {
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#050505] text-white">
      {/* Üst şerit — sabit, kısa */}
      <header className="shrink-0 border-b border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-3 sm:h-14 sm:px-5">
          <Link
            href={context.cancelUrl}
            className="inline-flex size-10 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Geri"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>

          <Image
            src={brandAssetUrl(brandLogos.forDarkSurface)}
            alt="BiletFeed"
            width={120}
            height={36}
            className="h-6 w-auto sm:h-7"
            priority
          />

          <div className="min-w-[4.5rem] text-right">
            <p className="text-[10px] font-medium uppercase tracking-wide text-white/45">
              Toplam
            </p>
            <p className="text-sm font-extrabold tabular-nums text-[var(--bf-neon)] sm:text-base">
              {formatTry(context.total)}
            </p>
          </div>
        </div>

        {/* Kompakt sipariş satırı — kapak yok, yer kaplamasın */}
        <div className="mx-auto flex max-w-6xl items-center gap-3 border-t border-white/5 px-3 py-2.5 sm:px-5">
          {context.coverImage ? (
            <div className="relative size-11 shrink-0 overflow-hidden rounded-lg sm:size-12">
              <Image
                src={context.coverImage}
                alt=""
                fill
                className="object-cover object-center"
                sizes="48px"
                priority
              />
            </div>
          ) : (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/5 sm:size-12">
              <Lock className="size-4 text-[var(--bf-neon)]" aria-hidden />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight">{context.eventTitle}</p>
            <p className="mt-0.5 truncate text-xs text-white/55">
              {context.ticketSummary || 'Bilet'} · Güvenli ödeme
            </p>
          </div>
          <p className="hidden items-center gap-1 text-[11px] text-white/50 sm:inline-flex">
            <ShieldCheck className="size-3.5 text-[var(--bf-neon)]" aria-hidden />
            SSL · 3DS
          </p>
        </div>
      </header>

      {/* Ödeme alanı — kalan viewport; kaydırma yalnızca iframe içinde */}
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-0 sm:px-5 sm:py-4 lg:flex-row lg:gap-5 lg:py-5">
        {/* Masaüstü yan panel */}
        <aside className="hidden w-[280px] shrink-0 flex-col gap-4 rounded-2xl border border-white/10 bg-[#111] p-5 lg:flex">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--bf-neon)]">
            Sipariş özeti
          </p>
          <div>
            <p className="text-base font-bold leading-snug">{context.eventTitle}</p>
            <p className="mt-2 text-sm text-white/60">{context.ticketSummary || 'Bilet'}</p>
          </div>
          <div className="mt-auto rounded-xl border border-[var(--bf-neon)]/25 bg-[var(--bf-neon)]/10 px-4 py-3">
            <p className="text-xs text-white/60">Ödenecek tutar</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-[var(--bf-neon)]">
              {formatTry(context.total)}
            </p>
          </div>
          <p className="text-[11px] leading-relaxed text-white/45">
            Kart bilgileriniz BiletFeed’de saklanmaz; ödeme İyzico altyapısı ile işlenir.
          </p>
          <PaymentCardLogos className="justify-start opacity-80" logoClassName="brightness-110" />
        </aside>

        {/* İyzico formu — temalı çerçeve, sabit oranlı alan */}
        <section
          className={cn(
            'relative flex min-h-0 flex-1 flex-col overflow-hidden',
            'bg-[#0b0b0b] sm:rounded-2xl sm:border sm:border-white/10'
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#111] px-3 py-2 sm:px-4">
            <p className="text-xs font-semibold text-white/70">
              Kart ile ödeme
            </p>
            <a
              href={context.hostedPaymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-white/45 transition-colors hover:text-[var(--bf-neon)]"
            >
              Tam ekran
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </div>

          <div className="relative min-h-0 flex-1 bg-[#f4f4f4]">
            {/* Üstte ince neon çizgi — marka maskesi */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-[var(--bf-neon)]"
              aria-hidden
            />
            <iframe
              title="İyzico güvenli ödeme formu"
              src={context.iframeUrl}
              className="absolute inset-0 h-full w-full border-0 bg-white"
              allow="payment *"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>

          <div className="flex shrink-0 items-center justify-center gap-2 border-t border-white/10 bg-[#0b0b0b] px-3 py-2 lg:hidden">
            <Lock className="size-3 text-[var(--bf-neon)]" aria-hidden />
            <p className="text-[10px] text-white/45">
              Kart verisi İyzico’da işlenir · BiletFeed saklamaz
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
