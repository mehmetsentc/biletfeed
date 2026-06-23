import type { EventJoyEvent, EventJoyProfile } from '@/lib/eventjoy/types';

const CONTACT_COLORS = [
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-pink-100 text-pink-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-teal-100 text-teal-700'
];

export function profileDisplayName(profile: EventJoyProfile): string {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  return name || 'Kullanıcı';
}

export function profileInitials(profile: EventJoyProfile): string {
  const first = profile.firstName?.trim()?.[0] ?? '';
  const last = profile.lastName?.trim()?.[0] ?? '';
  if (first || last) return `${first}${last}`.toUpperCase();
  return profile.email?.[0]?.toUpperCase() || 'K';
}

export function getGuestCounts(event: EventJoyEvent) {
  const yes = event.guests.filter((g) => g.status === 'confirmed').length;
  const no = event.guests.filter((g) => g.status === 'declined').length;
  const pending = event.guests.filter((g) => g.status === 'pending').length;
  return { all: event.guests.length, yes, no, pending };
}

export function syncEventGuestStats(event: EventJoyEvent): EventJoyEvent {
  const confirmed = event.guests.filter((g) => g.status === 'confirmed').length;
  const guestCount = event.guests.reduce(
    (sum, g) => sum + 1 + (g.plusOne ?? 0),
    0
  );
  return {
    ...event,
    confirmedCount: confirmed,
    guestCount: guestCount || event.guests.length
  };
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function contactColorForIndex(index: number): string {
  return CONTACT_COLORS[index % CONTACT_COLORS.length]!;
}

export function getUpcomingEvents(events: EventJoyEvent[]): EventJoyEvent[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return [...events]
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function totalConfirmedGuests(events: EventJoyEvent[]): number {
  return events.reduce((sum, e) => sum + e.confirmedCount, 0);
}
