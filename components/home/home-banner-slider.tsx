'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HomeBannerRecord } from '@/lib/services/home-banners';
import { cn } from '@/lib/utils';

const AUTO_MS = 6000;

const FALLBACK_SLIDES = [
  {
    id: 'fallback-1',
    title: 'Canlı etkinlikleri keşfet',
    subtitle: 'Konser, festival, tiyatro ve daha fazlası',
    imageMobile:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    imageTablet:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
    imageDesktop:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80',
    linkUrl: '/etkinlikler'
  }
] as const;

type Slide = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageMobile: string;
  imageTablet: string;
  imageDesktop: string;
  linkUrl?: string | null;
};

type HomeBannerSliderProps = {
  banners: HomeBannerRecord[];
};

function BannerSlide({
  slide,
  priority
}: {
  slide: Slide;
  priority?: boolean;
}) {
  const inner = (
    <>
      <div className="relative block aspect-[16/9] w-full sm:hidden">
        <Image
          src={slide.imageMobile}
          alt={slide.title}
          fill
          priority={priority}
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="relative hidden aspect-[21/9] w-full sm:block lg:hidden">
        <Image
          src={slide.imageTablet}
          alt={slide.title}
          fill
          priority={priority}
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="relative hidden aspect-[3/1] w-full lg:block">
        <Image
          src={slide.imageDesktop}
          alt={slide.title}
          fill
          priority={priority}
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      {(slide.subtitle || slide.title) && (
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 md:bottom-6 md:left-8 md:right-auto md:max-w-lg">
          {slide.subtitle ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-primary md:text-sm">
              {slide.subtitle}
            </p>
          ) : null}
          <p className="mt-1 text-lg font-extrabold tracking-tight text-white drop-shadow md:text-2xl">
            {slide.title}
          </p>
        </div>
      )}
    </>
  );

  if (slide.linkUrl) {
    return (
      <Link
        href={slide.linkUrl}
        className="relative block w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={slide.title}
      >
        {inner}
      </Link>
    );
  }

  return <div className="relative w-full overflow-hidden">{inner}</div>;
}

export function HomeBannerSlider({ banners }: HomeBannerSliderProps) {
  const slides: Slide[] =
    banners.length > 0
      ? banners.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          imageMobile: b.imageMobile,
          imageTablet: b.imageTablet,
          imageDesktop: b.imageDesktop,
          linkUrl: b.linkUrl
        }))
      : [...FALLBACK_SLIDES];

  const [index, setIndex] = useState(0);
  const count = slides.length;

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

  const current = slides[index];

  return (
    <div className="relative w-full bg-black" aria-label="Öne çıkan etkinlikler">
      <BannerSlide slide={current} priority={index === 0} />

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/70 md:left-5"
            aria-label="Önceki banner"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/70 md:right-5"
            aria-label="Sonraki banner"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="absolute bottom-3 right-4 z-10 flex gap-1.5 md:bottom-5 md:right-6">
            {slides.map((slide, dotIndex) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(dotIndex)}
                className="flex size-11 items-center justify-center"
                aria-label={`Banner ${dotIndex + 1}`}
              >
                <span
                  className={cn(
                    'block h-1.5 rounded-full transition-all',
                    dotIndex === index
                      ? 'w-6 bg-primary'
                      : 'w-1.5 bg-white/50 hover:bg-white/80'
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
