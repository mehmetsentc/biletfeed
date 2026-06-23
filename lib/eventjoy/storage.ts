import type {
  CreateEventJoyInput,
  EventJoyContact,
  EventJoyEvent,
  EventJoyGuest,
  EventJoyProfile,
  EventJoyStore
} from '@/lib/eventjoy/types';
import {
  contactColorForIndex,
  initialsFromName,
  syncEventGuestStats
} from '@/lib/eventjoy/utils';

const STORAGE_PREFIX = 'eventjoy-store';

function storageKey(userKey: string): string {
  return `${STORAGE_PREFIX}:${userKey}`;
}

export function emptyProfile(email = ''): EventJoyProfile {
  return {
    firstName: '',
    lastName: '',
    email,
    phone: '',
    country: 'Türkiye'
  };
}

export function emptyStore(email = ''): EventJoyStore {
  return {
    profile: emptyProfile(email),
    events: [],
    contacts: []
  };
}

export function readStore(userKey: string): EventJoyStore | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(userKey));
    if (!raw) return null;
    return JSON.parse(raw) as EventJoyStore;
  } catch {
    return null;
  }
}

export function writeStore(userKey: string, store: EventJoyStore): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userKey), JSON.stringify(store));
  window.dispatchEvent(
    new CustomEvent('eventjoy-store-change', { detail: { userKey } })
  );
}

export function createEventId(): string {
  return `ej_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildEvent(input: CreateEventJoyInput): EventJoyEvent {
  return syncEventGuestStats({
    id: createEventId(),
    title: input.title.trim(),
    type: input.type,
    date: input.date,
    time: input.time,
    location: input.location.trim(),
    description: input.description.trim(),
    coverColor: input.coverColor,
    coverImage: input.coverImage,
    guestCount: 0,
    confirmedCount: 0,
    budget: 0,
    spent: 0,
    guests: [],
    tasks: [],
    budgetItems: []
  });
}

export function buildContact(name: string, phone: string, index: number): EventJoyContact {
  return {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    phone: phone.trim(),
    initials: initialsFromName(name),
    color: contactColorForIndex(index)
  };
}

export function buildGuest(
  name: string,
  email: string,
  options?: Partial<EventJoyGuest>
): EventJoyGuest {
  return {
    id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    email: email.trim(),
    status: 'pending',
    ...options
  };
}
