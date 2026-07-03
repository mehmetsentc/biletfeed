import type { EventTypeValue } from '@/lib/event-rules/constants';
import { RULE_CATEGORY_SLUGS } from '@/lib/event-rules/constants';

/** Biletfeed tip slugs per event type */
export const TIPS_BY_EVENT_TYPE: Record<EventTypeValue | 'default', string[]> = {
  concert: [
    'tip-concert-erken-gel',
    'tip-concert-kulaklik',
    'tip-concert-hydration'
  ],
  festival: [
    'tip-festival-ayakkabi',
    'tip-festival-gunes-koruma',
    'tip-festival-nakit'
  ],
  theatre: [
    'tip-theatre-erken-gel',
    'tip-theatre-giyim',
    'tip-theatre-program'
  ],
  sports: [
    'tip-sports-taraftar',
    'tip-sports-erken-gel',
    'tip-sports-guvenlik'
  ],
  workshop: [
    'tip-workshop-malzeme',
    'tip-workshop-not',
    'tip-workshop-katilim'
  ],
  online: [
    'tip-online-baglanti',
    'tip-online-mikrofon',
    'tip-online-kayit'
  ],
  child: [
    'tip-child-yan-urun',
    'tip-child-erken-gel',
    'tip-child-rahat-giyim'
  ],
  comedy: [
    'tip-comedy-erken-gel',
    'tip-comedy-telefon',
    'tip-comedy-icecek'
  ],
  party: [
    'tip-party-giyim',
    'tip-party-taksi',
    'tip-party-kimlik'
  ],
  exhibition: [
    'tip-exhibition-fotograf',
    'tip-exhibition-sessiz',
    'tip-exhibition-sure'
  ],
  conference: [
    'tip-conference-network',
    'tip-conference-sarj',
    'tip-conference-not'
  ],
  other: ['tip-other-genel-1', 'tip-other-genel-2', 'tip-other-genel-3'],
  default: ['tip-other-genel-1', 'tip-other-genel-2', 'tip-other-genel-3']
};

export function getTipSlugsForEventType(eventType?: string): string[] {
  const key = (eventType ?? 'other') as EventTypeValue;
  return TIPS_BY_EVENT_TYPE[key] ?? TIPS_BY_EVENT_TYPE.default;
}

export const TIPS_CATEGORY_SLUG = RULE_CATEGORY_SLUGS.BILETFEED_TIPS;
