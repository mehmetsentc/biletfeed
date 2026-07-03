import type { PerformerRow, AttendeeQuestionRow } from '@/components/organizator-panel/event-wizard/types';
import type { CitySlug } from '@/lib/location/cities';
import type { EventRuleSetState } from '@/components/organizator-panel/event-wizard/wizard-step-rules';

const DRAFT_KEY = 'bf-organizer-event-wizard-draft';
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type EventWizardDraft = {
  version: 1;
  step: number;
  title: string;
  category: string;
  citySlug: CitySlug;
  eventTypeMode: 'single' | 'recurring';
  sessions: Array<{
    id: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  }>;
  location: '' | 'venue' | 'online' | 'hybrid';
  venueName: string;
  venueAddress: string;
  venueDetail: string;
  onlineUrl: string;
  tags: string[];
  performers: PerformerRow[];
  description: string;
  ticketType: 'free' | 'paid';
  ticketCategories: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    capacity: string;
    showLowStockBadge?: boolean;
  }>;
  attendeeQuestions: AttendeeQuestionRow[];
  preventQuestionCopy: boolean;
  accessPassword: string;
  hiddenFromSearch: boolean;
  termsAccepted: boolean;
  previewImageUrl: string | null;
  ruleSet?: EventRuleSetState;
  savedAt: number;
};

export type EventWizardDraftInput = Omit<EventWizardDraft, 'version' | 'savedAt'>;

export function loadEventWizardDraft(): EventWizardDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EventWizardDraft;
    if (parsed.version !== 1) return null;
    if (Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) {
      sessionStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveEventWizardDraft(draft: EventWizardDraftInput): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: EventWizardDraft = {
      ...draft,
      version: 1,
      savedAt: Date.now()
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function clearEventWizardDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
