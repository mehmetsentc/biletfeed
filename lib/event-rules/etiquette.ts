import { RULE_CATEGORY_SLUGS } from '@/lib/event-rules/constants';

/** Etiquette rule slugs auto-included based on event category */
export const ETIQUETTE_BY_CATEGORY: Record<string, string[]> = {
  muzik: [
    'gorgu-saygili-davran',
    'gorgu-telefon-sessiz',
    'gorgu-sarki-soyleme',
    'gorgu-dans-alani'
  ],
  festival: [
    'gorgu-saygili-davran',
    'gorgu-cop-atma',
    'gorgu-alan-temizligi',
    'gorgu-grup-halinde'
  ],
  tiyatro: [
    'gorgu-sessizlik',
    'gorgu-telefon-kapali',
    'gorgu-fotograf-cekme-yasak',
    'gorgu-gec-kalma'
  ],
  spor: [
    'gorgu-taraftar-saygi',
    'gorgu-protokol-alani',
    'gorgu-dalga-yapmama'
  ],
  komedi: [
    'gorgu-saygili-davran',
    'gorgu-telefon-sessiz',
    'gorgu-sahneye-mudahale'
  ],
  cocuk: [
    'gorgu-cocuk-gozetimi',
    'gorgu-saygili-davran',
    'gorgu-gurultu-kontrol'
  ],
  default: [
    'gorgu-saygili-davran',
    'gorgu-telefon-sessiz',
    'gorgu-alan-temizligi'
  ]
};

export function getEtiquetteSlugsForCategory(categorySlug?: string): string[] {
  if (!categorySlug) return ETIQUETTE_BY_CATEGORY.default;
  return ETIQUETTE_BY_CATEGORY[categorySlug] ?? ETIQUETTE_BY_CATEGORY.default;
}

export const ETIQUETTE_CATEGORY_SLUG = RULE_CATEGORY_SLUGS.ETIQUETTE;
