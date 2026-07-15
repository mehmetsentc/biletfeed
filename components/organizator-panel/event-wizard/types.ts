export type PerformerType = 'person' | 'group';

export interface PerformerRow {
  id: string;
  name: string;
  type: PerformerType;
  /** Set when linked to an Artist DB record */
  artistId?: string;
  /** Profile image URL from Artist record */
  image?: string;
  /** Role text shown on event page (e.g. "Headliner", "DJ") */
  role?: string;
}

export interface AttendeeQuestionRow {
  id: string;
  question: string;
  required: boolean;
}
