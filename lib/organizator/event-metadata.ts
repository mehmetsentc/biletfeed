import { ORGANIZER_AGREEMENT_VERSION } from '@/lib/organizator/event-wizard-constants';

export type EventPerformerMeta = {
  name: string;
  type: 'person' | 'group';
};

export type EventAttendeeQuestionMeta = {
  question: string;
  required: boolean;
};

export type EventSeoMeta = {
  performers?: EventPerformerMeta[];
  preventQuestionCopy?: boolean;
  accessPassword?: string;
  hiddenFromSearch?: boolean;
  venueDetail?: string;
  organizerTermsAcceptedAt?: string;
  organizerTermsVersion?: string;
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
    ...(extras.performers?.length ? { performers: extras.performers } : {}),
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
