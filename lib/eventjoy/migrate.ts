import type { EventJoyContact, EventJoyEvent, EventJoyProfile, EventJoyStore } from './types';
import { emptyProfile, emptyStore } from './storage';

export const EVENTJOY_STORE_VERSION = 2;

const DEMO_EVENT_IDS = new Set(['ej1', 'ej2', 'ej3']);
const DEMO_EVENT_TITLES = new Set([
  'Aile Buluşması',
  'Doğum Günü Partisi',
  'Yaz Barbekü'
]);
const DEMO_CONTACT_IDS = new Set([
  'c1',
  'c2',
  'c3',
  'c4',
  'c5',
  'c6',
  'c7',
  'c8'
]);

function isDemoProfile(profile: EventJoyProfile): boolean {
  return (
    profile.firstName === 'Dylan' &&
    (profile.lastName === 'Thomas' || !profile.lastName)
  );
}

function isDemoEvent(event: EventJoyEvent): boolean {
  return DEMO_EVENT_IDS.has(event.id) || DEMO_EVENT_TITLES.has(event.title);
}

function isDemoContact(contact: EventJoyContact): boolean {
  return DEMO_CONTACT_IDS.has(contact.id);
}

function profileFromDisplayName(
  displayName: string | undefined,
  email: string
): EventJoyProfile {
  const profile = emptyProfile(email);
  if (!displayName?.trim()) return profile;
  const parts = displayName.trim().split(/\s+/);
  profile.firstName = parts[0] || '';
  profile.lastName = parts.slice(1).join(' ');
  return profile;
}

export function normalizeEventJoyStore(
  raw: EventJoyStore | null,
  options: { email: string; displayName?: string }
): EventJoyStore {
  const { email, displayName } = options;
  const authProfile = profileFromDisplayName(displayName, email);

  if (!raw) {
    return {
      ...emptyStore(email),
      profile: authProfile,
      version: EVENTJOY_STORE_VERSION
    };
  }

  const version = (raw as EventJoyStore & { version?: number }).version ?? 1;
  const hasDemoEvents = raw.events.some(isDemoEvent);
  const hasDemoContacts = raw.contacts.some(isDemoContact);
  const demoProfile = isDemoProfile(raw.profile);

  const events = raw.events.filter((event) => !isDemoEvent(event));
  const contacts = raw.contacts.filter((contact) => !isDemoContact(contact));

  const profile = demoProfile
    ? authProfile
    : {
        ...emptyProfile(email),
        ...raw.profile,
        email: raw.profile.email || email
      };

  const migrated: EventJoyStore & { version: number } = {
    profile,
    events,
    contacts,
    version: EVENTJOY_STORE_VERSION
  };

  if (
    version < EVENTJOY_STORE_VERSION ||
    hasDemoEvents ||
    hasDemoContacts ||
    demoProfile
  ) {
    return migrated;
  }

  return { ...raw, profile, version: EVENTJOY_STORE_VERSION };
}

export function storeNeedsPersist(
  before: EventJoyStore | null,
  after: EventJoyStore
): boolean {
  if (!before) return true;
  return JSON.stringify(before) !== JSON.stringify(after);
}
