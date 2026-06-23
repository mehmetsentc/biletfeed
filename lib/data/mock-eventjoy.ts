/** @deprecated mock-eventjoy — tipler ve şablonlar lib/eventjoy altında */
export type {
  GuestStatus,
  EventJoyGuest,
  EventJoyTask,
  EventJoyBudgetItem,
  EventJoyContact,
  EventJoyTemplate,
  EventJoyEvent,
  EventJoyProfile
} from '@/lib/eventjoy/types';

export { invitationTemplates } from '@/lib/eventjoy/templates';
export { getGuestCounts } from '@/lib/eventjoy/utils';

/** Boş dizi — geriye dönük import uyumluluğu */
export const mockEventJoyEvents: never[] = [];
export const mockContacts: never[] = [];
export const mockEventJoyMessages: never[] = [];

export function getEventJoyEvent(_id: string) {
  return undefined;
}
