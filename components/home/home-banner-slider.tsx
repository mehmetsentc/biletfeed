'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import type { HeroBannerSlide } from '@/lib/banners/hero-slide-types';
import { useTranslations } from '@/components/providers';
import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';
import { cn } from '@/lib/utils';

const AUTO_MS = 6500;

type HomeBannerSliderProps = {
  slides: HeroBannerSlide[];
};

function slideImage(slide: HeroBannerSlide, variant: 'mobile' | 'tablet' | 'desktop'): string {
  if (variant === 'mobile' && slide.imageMobile) return slide.imageMobile;
  if (variant === 'tablet' && slide.imageTablet) return slide.imageTablet;
  if (variant === 'desktop' && slide.imageDesktop) return slide.imageDesktop;
  if (slide.id.startsWith('event-')) {
    const eventId = slide.id.replace(/^event-/, '');
    return `/api/banners/render/${eventId}?v=${variant}`;
  }
  return slide.coverImage;
}

function BannerSlide({
  slide,
  priority,
  buyTicketLabel
}: {
  slide: HeroBannerSlide;
  priority?: boolean;
  buyTicketLabel: string;
}) {
  const content = (
    <>
      <div className="relative block aspect-[16/9] w-full sm:hidden">
        <Image
          src={slideImage(slide, 'mobile')}
          alt={slide.title}
          fill
          priority={priority}
          unoptimized={slideImage(slide, 'mobile').startsWith('/api/')}
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="relative hidden aspect-[21/9] w-full sm:block lg:hidden">
        <Image
          src={slideImage(slide, 'tablet')}
          alt={slide.title}
          fill
          priority={priority}
          unoptimized={slideImage(slide, 'tablet').startsWith('/api/')}
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="relative hidden aspect-[3/1] w-full lg:block">
        <Image
          src={slideImage(slide, 'desktop')}
          alt={slide.title}
          fill
          priority={priority}
          unoptimized={slideImage(slide, 'desktop').startsWith('/api/')}
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* BiletFeed marka katmanı */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/55"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-[10%] min-w-[36px] max-w-[88px] bg-primary"
        style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-[7%] min-w-[28px] max-w-[64px] bg-primary/90"
        style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
        aria-hidden
      />

      <div className="pointer-events-none absolute right-4 top-4 z-10 hidden opacity-90 sm:block md:right-8 md:top-6">
        <Image
          src={brandAssetUrl(brandLogos.forDarkSurface)}
          alt="BiletFeed"
          width={120}
          height={34}
          className="h-7 w-auto md:h-8"
        />
        <p className="mt-1 text-right text-[10px] font-medium tracking-wide text-white/70 md:text-xs">
          Daha fazla bilet, daha fazla anı
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-end">
        <div className="w-full px-5 pb-6 pt-16 sm:px-10 sm:pb-8 md:px-14 md:pb-10 lg:max-w-3xl">
          {slide.highlight ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--bf-accent-ink)] sm:text-xs">
              {slide.highlight}
            </p>
          ) : null}
          <h2 className="mt-2 text-xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-[2.75rem]">
            {slide.title}
          </h2>
          {slide.promoLine ? (
            <p className="mt-2 max-w-xl text-sm font-medium text-white/85 sm:text-base md:mt-3">
              {slide.promoLine}
            </p>
          ) : null}
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 sm:mt-5">
            <Ticket className="size-4" aria-hidden />
            {buyTicketLabel}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <Link
      href={slide.linkUrl}
      className="group relative block w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`${slide.title} — ${buyTicketLabel}`}
    >
      {content}
    </Link>
  );
}

export function HomeBannerSlider({ slides }: HomeBannerSliderProps) {
  const t = useTranslations();
  const fallback: HeroBannerSlide = {
    id: 'fallback',
    title: t.home.bannerDiscover,
    highlight: t.home.bannerFeatured,
    promoLine: t.home.bannerSubtitle,
    coverImage:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80',
    linkUrl: '/etkinlikler'
  };
  const items = slides.length > 0 ? slides.slice(0, 5) : [fallback];
  const [index, setIndex] = useState(0);
  const count = items.length;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [count]);

  const current = items[index];

  return (
    <div className="relative w-full bg-black" aria-label={t.home.bannerFeatured}>
      <BannerSlide
        slide={current}
        priority={index === 0}
        buyTicketLabel={t.chrome.getTickets}
      />

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="absolute left-3 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/75 md:left-5"
            aria-label="Önceki"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="absolute right-3 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/75 md:right-5"
            aria-label="Sonraki"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 md:bottom-5">
            {items.map((slide, dotIndex) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(dotIndex)}
                className="flex size-10 items-center justify-center"
                aria-label={`Slayt ${dotIndex + 1}`}
              >
                <span
                  className={cn(
                    'block h-1.5 rounded-full transition-all',
                    dotIndex === index
                      ? 'w-7 bg-primary'
                      : 'w-1.5 bg-white/45 hover:bg-white/75'
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
