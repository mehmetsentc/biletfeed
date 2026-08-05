import { SPOTLIGHT_DIMENSIONS } from '@/lib/config/image-dimensions';

export type HeroBannerSlide = {
  id: string;
  title: string;
  /** Üst satır — kategori / vurgu (turuncu) */
  highlight: string;
  /** Alt satır — tarih · şehir · promo */
  promoLine: string;
  coverImage: string;
  linkUrl: string;
  /** Önceden üretilmiş banner görselleri (admin) */
  imageMobile?: string;
  imageTablet?: string;
  imageDesktop?: string;
};

export const HERO_BANNER_LIMIT = 5;

/** @deprecated Use SPOTLIGHT_DIMENSIONS — re-export for Sharp engine */
export const BANNER_DIMENSIONS = SPOTLIGHT_DIMENSIONS;
