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

export const BANNER_DIMENSIONS = {
  mobile: { width: 800, height: 450 },
  tablet: { width: 1280, height: 548 },
  desktop: { width: 1920, height: 640 }
} as const;
