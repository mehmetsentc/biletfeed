'use client';

import { useEffect, useRef, useState } from 'react';
import type { HeroBannerSlide } from '@/lib/banners/hero-slide-types';
import { useCity } from '@/components/providers/city-provider';
import { HomeBannerSlider } from '@/components/home/home-banner-slider';

type HomeHeroSliderProps = {
  initialSlides: HeroBannerSlide[];
};

export function HomeHeroSlider({ initialSlides }: HomeHeroSliderProps) {
  const { citySlug } = useCity();
  const [slides, setSlides] = useState(initialSlides);
  const activeSlugRef = useRef(citySlug);

  useEffect(() => {
    if (citySlug === activeSlugRef.current) return;

    let cancelled = false;

    fetch(`/api/home/hero-slides?sehir=${encodeURIComponent(citySlug)}`, {
      credentials: 'same-origin'
    })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<{ slides: HeroBannerSlide[]; citySlug: string }>;
      })
      .then((data) => {
        if (cancelled) return;
        activeSlugRef.current = data.citySlug;
        setSlides(data.slides);
      })
      .catch(() => {
        // Önceki slaytlar korunur
      });

    return () => {
      cancelled = true;
    };
  }, [citySlug]);

  return <HomeBannerSlider slides={slides} />;
}
