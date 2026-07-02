'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HomeBannerRecord } from '@/lib/services/home-banners';
import { cn } from '@/lib/utils';

const AUTO_MS = 6000;

type HomeFeaturedBannersProps = {
  banners: HomeBannerRecord[];
};

function BannerSlide({
  banner,
  priority
}: {
  banner: HomeBannerRecord;
  priority?: boolean;
}) {
  const href = banner.linkUrl || undefined;
  const alt = banner.title;

  const content = (
    <>
      <div className="relative block aspect-[16/9] w-full md:hidden">
        <Image
          src={banner.imageMobile}
          alt={alt}
          fill
          priority={priority}
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="relative hidden aspect-[21/9] w-full md:block lg:hidden">
        <Image
          src={banner.imageTablet}
          alt={alt}
          fill
          priority={priority}
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="relative hidden aspect-[3/1] w-full lg:block">
        <Image
          src={banner.imageDesktop}
          alt={alt}
          fill
          priority={priority}
          className="object-cover"
          sizes="100vw"
        />
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={banner.title}
      >
        {content}
      </Link>
    );
  }

  return <div className="overflow-hidden rounded-xl">{content}</div>;
}

export function HomeFeaturedBanners({ banners }: HomeFeaturedBannersProps) {
  const [index, setIndex] = useState(0);
  const count = banners.length;

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

  if (count === 0) return null;

  const current = banners[index];

  return (
    <section
      className="border-b border-border/60 bg-background"
      aria-label="Öne çıkan etkinlikler"
    >
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div className="relative">
          <BannerSlide banner={current} priority={index === 0} />

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                className="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 md:left-3"
                aria-label="Önceki banner"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                className="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 md:right-3"
                aria-label="Sonraki banner"
              >
                <ChevronRight className="size-5" />
              </button>

              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                {banners.map((banner, dotIndex) => (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => goTo(dotIndex)}
                    className={cn(
                      'size-2 rounded-full transition',
                      dotIndex === index
                        ? 'bg-white'
                        : 'bg-white/45 hover:bg-white/70'
                    )}
                    aria-label={`Banner ${dotIndex + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
