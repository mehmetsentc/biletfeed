import type { HeroBannerSlide } from '@/lib/banners/hero-slide-types';
import { HomeBannerSlider } from '@/components/home/home-banner-slider';
import { HomeEventSearchBar } from '@/components/home/home-event-search-bar';

type CategoryOption = {
  slug: string;
  name: string;
};

type HomeHeroSectionProps = {
  slides: HeroBannerSlide[];
  categories: CategoryOption[];
};

export function HomeHeroSection({ slides, categories }: HomeHeroSectionProps) {
  return (
    <section className="border-b border-border/60 bg-background" aria-label="Ana sayfa hero">
      <HomeBannerSlider slides={slides} />
      <div className="container mx-auto px-4 py-2 md:py-6">
        <HomeEventSearchBar categories={categories} />
      </div>
    </section>
  );
}
