'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import type {
  CreateEventJoyInput,
  EventJoyContact,
  EventJoyEvent,
  EventJoyGuest,
  EventJoyProfile,
  EventJoyStore
} from '@/lib/eventjoy/types';
import {
  buildContact,
  buildEvent,
  buildGuest,
  emptyStore,
  readStore,
  writeStore
} from '@/lib/eventjoy/storage';
import {
  normalizeEventJoyStore,
  storeNeedsPersist
} from '@/lib/eventjoy/migrate';
import { syncEventGuestStats } from '@/lib/eventjoy/utils';

interface EventJoyContextValue {
  ready: boolean;
  profile: EventJoyProfile;
  events: EventJoyEvent[];
  contacts: EventJoyContact[];
  updateProfile: (patch: Partial<EventJoyProfile>) => void;
  addEvent: (input: CreateEventJoyInput) => EventJoyEvent;
  updateEvent: (id: string, patch: Partial<EventJoyEvent>) => void;
  getEvent: (id: string) => EventJoyEvent | undefined;
  addContact: (name: string, phone: string) => void;
  addGuestsToEvent: (eventId: string, contactIds: string[]) => void;
  addGuestToEvent: (eventId: string, guest: Omit<EventJoyGuest, 'id'>) => void;
}

const EventJoyContext = createContext<EventJoyContextValue | null>(null);

function userKeyFromAuth(uid?: string | null): string {
  return uid || 'guest';
}

export function EventJoyProvider({ children }: { children: ReactNode }) {
  const { user, firebaseUser } = useAuth();
  const key = userKeyFromAuth(user?.uid ?? firebaseUser?.uid);
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<EventJoyStore>(() => emptyStore());

  useEffect(() => {
    const email = user?.email || firebaseUser?.email || '';
    const displayName = user?.displayName || firebaseUser?.displayName || undefined;
    const stored = readStore(key);
    const normalized = normalizeEventJoyStore(stored, { email, displayName });

    setStore(normalized);
    if (storeNeedsPersist(stored, normalized)) {
      writeStore(key, normalized);
    }
    setReady(true);
  }, [
    key,
    user?.uid,
    user?.email,
    user?.displayName,
    firebaseUser?.email,
    firebaseUser?.uid,
    firebaseUser?.displayName
  ]);

  useEffect(() => {
    function onStoreChange(e: Event) {
      const detail = (e as CustomEvent<{ userKey: string }>).detail;
      if (detail?.userKey === key) {
        const next = readStore(key);
        if (next) setStore(next);
      }
    }
    window.addEventListener('eventjoy-store-change', onStoreChange);
    return () => window.removeEventListener('eventjoy-store-change', onStoreChange);
  }, [key]);

  const persist = useCallback(
    (next: EventJoyStore) => {
      setStore(next);
      writeStore(key, next);
    },
    [key]
  );

  const updateProfile = useCallback(
    (patch: Partial<EventJoyProfile>) => {
      persist({
        ...store,
        profile: { ...store.profile, ...patch }
      });
    },
    [persist, store]
  );

  const addEvent = useCallback(
    (input: CreateEventJoyInput) => {
      const event = buildEvent(input);
      persist({ ...store, events: [event, ...store.events] });
      return event;
    },
    [persist, store]
  );

  const updateEvent = useCallback(
    (id: string, patch: Partial<EventJoyEvent>) => {
      const events = store.events.map((e) =>
        e.id === id ? syncEventGuestStats({ ...e, ...patch }) : e
      );
      persist({ ...store, events });
    },
    [persist, store]
  );

  const getEvent = useCallback(
    (id: string) => store.events.find((e) => e.id === id),
    [store.events]
  );

  const addContact = useCallback(
    (name: string, phone: string) => {
      const contact = buildContact(name, phone, store.contacts.length);
      persist({ ...store, contacts: [...store.contacts, contact] });
    },
    [persist, store]
  );

  const addGuestsToEvent = useCallback(
    (eventId: string, contactIds: string[]) => {
      const contacts = store.contacts.filter((c) => contactIds.includes(c.id));
      const events = store.events.map((e) => {
        if (e.id !== eventId) return e;
        const newGuests = contacts.map((c) =>
          buildGuest(c.name, '', { phone: c.phone, status: 'pending' })
        );
        return syncEventGuestStats({
          ...e,
          guests: [...e.guests, ...newGuests]
        });
      });
      persist({ ...store, events });
    },
    [persist, store]
  );

  const addGuestToEvent = useCallback(
    (eventId: string, guest: Omit<EventJoyGuest, 'id'>) => {
      const events = store.events.map((e) => {
        if (e.id !== eventId) return e;
        return syncEventGuestStats({
          ...e,
          guests: [...e.guests, buildGuest(guest.name, guest.email, guest)]
        });
      });
      persist({ ...store, events });
    },
    [persist, store]
  );

  const value = useMemo(
    () => ({
      ready,
      profile: store.profile,
      events: store.events,
      contacts: store.contacts,
      updateProfile,
      addEvent,
      updateEvent,
      getEvent,
      addContact,
      addGuestsToEvent,
      addGuestToEvent
    }),
    [
      ready,
      store,
      updateProfile,
      addEvent,
      updateEvent,
      getEvent,
      addContact,
      addGuestsToEvent,
      addGuestToEvent
    ]
  );

  return (
    <EventJoyContext.Provider value={value}>{children}</EventJoyContext.Provider>
  );
}

export function useEventJoy() {
  const ctx = useContext(EventJoyContext);
  if (!ctx) {
    throw new Error('useEventJoy must be used within EventJoyProvider');
  }
  return ctx;
}
