/** System rule category slugs */
export const RULE_CATEGORY_SLUGS = {
  ENTRY: 'giris',
  AGE: 'yas',
  CHILD: 'cocuk',
  TICKET: 'bilet',
  PAYMENT: 'odeme',
  SEATING: 'oturma',
  SECURITY: 'guvenlik',
  PHOTO: 'fotograf',
  PRIVACY: 'gizlilik',
  FOOD: 'yiyecek',
  PETS: 'evcil-hayvan',
  WEATHER: 'hava',
  HEALTH: 'saglik',
  SPORT: 'spor',
  FESTIVAL: 'festival',
  ACCOMMODATION: 'konaklama',
  VENUE: 'mekan',
  DRESS_CODE: 'dress-code',
  ORGANIZER_RIGHTS: 'organizator-haklari',
  COMMERCIAL: 'ticari',
  BELONGINGS: 'kisisel-esyalar',
  ACCESSIBILITY: 'erisilebilirlik',
  SERVICES: 'hizmetler',
  ETIQUETTE: 'etkinlik-gorgu',
  BILETFEED_TIPS: 'biletfeed-tavsiyeleri'
} as const;

export type RuleCategorySlug =
  (typeof RULE_CATEGORY_SLUGS)[keyof typeof RULE_CATEGORY_SLUGS];

/** Public display section groupings */
export const PUBLIC_RULE_SECTIONS: Array<{
  slug: string;
  titleTr: string;
  titleEn: string;
  categorySlugs: string[];
}> = [
  {
    slug: 'event-rules',
    titleTr: 'Etkinlik Kuralları',
    titleEn: 'Event Rules',
    categorySlugs: [
      RULE_CATEGORY_SLUGS.ENTRY,
      RULE_CATEGORY_SLUGS.AGE,
      RULE_CATEGORY_SLUGS.CHILD,
      RULE_CATEGORY_SLUGS.SECURITY,
      RULE_CATEGORY_SLUGS.HEALTH,
      RULE_CATEGORY_SLUGS.WEATHER,
      RULE_CATEGORY_SLUGS.VENUE,
      RULE_CATEGORY_SLUGS.DRESS_CODE,
      RULE_CATEGORY_SLUGS.PETS,
      RULE_CATEGORY_SLUGS.FOOD,
      RULE_CATEGORY_SLUGS.PHOTO,
      RULE_CATEGORY_SLUGS.PRIVACY,
      RULE_CATEGORY_SLUGS.SPORT,
      RULE_CATEGORY_SLUGS.FESTIVAL,
      RULE_CATEGORY_SLUGS.ACCOMMODATION,
      RULE_CATEGORY_SLUGS.ACCESSIBILITY,
      RULE_CATEGORY_SLUGS.SERVICES,
      RULE_CATEGORY_SLUGS.BELONGINGS
    ]
  },
  {
    slug: 'ticket-policy',
    titleTr: 'Bilet Politikası',
    titleEn: 'Ticket Policy',
    categorySlugs: [
      RULE_CATEGORY_SLUGS.TICKET,
      RULE_CATEGORY_SLUGS.PAYMENT,
      RULE_CATEGORY_SLUGS.SEATING,
      RULE_CATEGORY_SLUGS.ORGANIZER_RIGHTS,
      RULE_CATEGORY_SLUGS.COMMERCIAL
    ]
  },
  {
    slug: 'etiquette',
    titleTr: 'Etkinlik Görgü Kuralları',
    titleEn: 'Event Etiquette',
    categorySlugs: [RULE_CATEGORY_SLUGS.ETIQUETTE]
  },
  {
    slug: 'biletfeed-tips',
    titleTr: 'Biletfeed Tavsiyeleri',
    titleEn: 'Biletfeed Tips',
    categorySlugs: [RULE_CATEGORY_SLUGS.BILETFEED_TIPS]
  }
];

export const EVENT_TYPE_VALUES = [
  'concert',
  'festival',
  'theatre',
  'sports',
  'workshop',
  'online',
  'child',
  'comedy',
  'party',
  'exhibition',
  'conference',
  'other'
] as const;

export type EventTypeValue = (typeof EVENT_TYPE_VALUES)[number];

/** Map BiletFeed category slugs to event type for rule suggestions */
export const CATEGORY_TO_EVENT_TYPE: Record<string, EventTypeValue> = {
  muzik: 'concert',
  festival: 'festival',
  tiyatro: 'theatre',
  spor: 'sports',
  sanat: 'exhibition',
  komedi: 'comedy',
  cocuk: 'child',
  teknoloji: 'conference',
  online: 'online',
  party: 'party',
  diger: 'other'
};

export const PARAMETER_TYPE_LABELS: Record<
  string,
  { tr: string; en: string }
> = {
  age_limit: { tr: 'Yaş sınırı', en: 'Age limit' },
  door_time: { tr: 'Kapı açılış saati', en: 'Door time' },
  duration: { tr: 'Süre', en: 'Duration' },
  dress_code: { tr: 'Kıyafet kodu', en: 'Dress code' },
  child_policy: { tr: 'Çocuk politikası', en: 'Child policy' },
  refund_policy: { tr: 'İade politikası', en: 'Refund policy' },
  custom_text: { tr: 'Özel metin', en: 'Custom text' },
  custom_number: { tr: 'Sayı', en: 'Number' }
};

export const AGE_LIMIT_OPTIONS = [
  { value: '0+', labelTr: 'Her yaş', labelEn: 'All ages' },
  { value: '7+', labelTr: '7 yaş ve üzeri', labelEn: '7+' },
  { value: '13+', labelTr: '13 yaş ve üzeri', labelEn: '13+' },
  { value: '16+', labelTr: '16 yaş ve üzeri', labelEn: '16+' },
  { value: '18+', labelTr: '18 yaş ve üzeri', labelEn: '18+' },
  { value: '21+', labelTr: '21 yaş ve üzeri', labelEn: '21+' }
];

export const DRESS_CODE_OPTIONS = [
  { value: 'casual', labelTr: 'Günlük', labelEn: 'Casual' },
  { value: 'smart-casual', labelTr: 'Smart casual', labelEn: 'Smart casual' },
  { value: 'formal', labelTr: 'Resmi', labelEn: 'Formal' },
  { value: 'black-tie', labelTr: 'Smokin / gece kıyafeti', labelEn: 'Black tie' },
  { value: 'themed', labelTr: 'Temalı kıyafet', labelEn: 'Themed' }
];

export const REFUND_POLICY_OPTIONS = [
  { value: 'no-refund', labelTr: 'İade yok', labelEn: 'No refunds' },
  { value: '7-days', labelTr: '7 gün öncesine kadar', labelEn: 'Up to 7 days before' },
  { value: '48-hours', labelTr: '48 saat öncesine kadar', labelEn: 'Up to 48 hours before' },
  { value: 'event-cancelled', labelTr: 'Yalnızca iptal durumunda', labelEn: 'Event cancellation only' }
];

export const CHILD_POLICY_OPTIONS = [
  { value: 'all-ages', labelTr: 'Tüm yaşlar kabul', labelEn: 'All ages welcome' },
  { value: 'babies-free', labelTr: '0-2 yaş ücretsiz', labelEn: '0-2 free' },
  { value: 'no-strollers', labelTr: 'Bebek arabası yasak', labelEn: 'No strollers' },
  { value: 'child-ticket-required', labelTr: 'Çocuk bileti zorunlu', labelEn: 'Child ticket required' }
];
