import { ORGANIZER_AGREEMENT_VERSION } from '@/lib/organizator/event-wizard-constants';

export type EventPerformerMeta = {
  name: string;
  type: 'person' | 'group';
};

export type EventAttendeeQuestionMeta = {
  question: string;
  required: boolean;
};

export type EventSeriesMeta = {
  seriesId: string;
  sessionIndex: number;
  sessionCount: number;
};

export type EventSeoMeta = {
  performers?: EventPerformerMeta[];
  preventQuestionCopy?: boolean;
  accessPassword?: string;
  hiddenFromSearch?: boolean;
  venueDetail?: string;
  organizerTermsAcceptedAt?: string;
  organizerTermsVersion?: string;
  seriesId?: string;
  sessionIndex?: number;
  sessionCount?: number;
};

export interface OrganizerEventExtras {
  tags?: string[];
  venueDetail?: string;
  rules?: string;
  isOnline?: boolean;
  onlineUrl?: string;
  performers?: EventPerformerMeta[];
  attendeeQuestions?: EventAttendeeQuestionMeta[];
  preventQuestionCopy?: boolean;
  accessPassword?: string;
  hiddenFromSearch?: boolean;
  organizerTermsAccepted?: boolean;
  seriesMeta?: EventSeriesMeta;
}

export function parsePerformersFromSeo(seo: unknown): EventPerformerMeta[] {
  if (!seo || typeof seo !== 'object' || Array.isArray(seo)) return [];
  const raw = (seo as { performers?: unknown }).performers;
  if (!Array.isArray(raw)) return [];

  const performers: EventPerformerMeta[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const name = typeof (item as { name?: unknown }).name === 'string'
      ? (item as { name: string }).name.trim()
      : '';
    if (!name) continue;
    const typeRaw = (item as { type?: unknown }).type;
    const type: EventPerformerMeta['type'] =
      typeRaw === 'group' ? 'group' : 'person';
    performers.push({ name, type });
  }
  return performers;
}

export function buildEventExtrasData(extras: OrganizerEventExtras): {
  tags: string[];
  rules: string;
  isOnline: boolean;
  onlineUrl: string | null;
  faqs: EventAttendeeQuestionMeta[];
  seo: EventSeoMeta;
} {
  const seo: EventSeoMeta = {
    ...(extras.performers !== undefined
      ? {
          performers: extras.performers
            .map((p) => ({
              name: p.name.trim(),
              type: p.type === 'group' ? ('group' as const) : ('person' as const)
            }))
            .filter((p) => p.name.length > 0)
        }
      : {}),
    ...(extras.preventQuestionCopy ? { preventQuestionCopy: true } : {}),
    ...(extras.accessPassword?.trim()
      ? { accessPassword: extras.accessPassword.trim() }
      : {}),
    ...(extras.hiddenFromSearch ? { hiddenFromSearch: true } : {}),
    ...(extras.venueDetail?.trim() ? { venueDetail: extras.venueDetail.trim() } : {}),
    ...(extras.organizerTermsAccepted
      ? {
          organizerTermsAcceptedAt: new Date().toISOString(),
          organizerTermsVersion: ORGANIZER_AGREEMENT_VERSION
        }
      : {}),
    ...(extras.seriesMeta
      ? {
          seriesId: extras.seriesMeta.seriesId,
          sessionIndex: extras.seriesMeta.sessionIndex,
          sessionCount: extras.seriesMeta.sessionCount
        }
      : {})
  };

  return {
    tags: extras.tags ?? [],
    rules: extras.rules?.trim() ?? '',
    isOnline: extras.isOnline ?? false,
    onlineUrl: extras.onlineUrl?.trim() || null,
    faqs: extras.attendeeQuestions ?? [],
    seo
  };
}
