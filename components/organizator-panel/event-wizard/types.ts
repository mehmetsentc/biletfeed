export type PerformerType = 'person' | 'group';

export interface PerformerRow {
  id: string;
  name: string;
  type: PerformerType;
}

export interface AttendeeQuestionRow {
  id: string;
  question: string;
  required: boolean;
}
