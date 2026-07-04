import { describe, expect, it } from 'vitest';
import type { MockEvent } from '@/lib/data/mock-events';
import { sortEvents } from '@/lib/events/sort-events';

function makeEvent(overrides: Partial<MockEvent> & Pick<MockEvent, 'id' | 'startDate'>): MockEvent {
  return {
    title: 'Test',
    slug: overrides.id,
    shortDescription: '',
    description: '',
    coverImage: '',
    gallery: [],
    category: 'Konser',
    categorySlug: 'muzik',
    eventType: 'concert',
    city: 'İstanbul',
    citySlug: 'istanbul',
    venue: 'Venue',
    address: 'Adres',
    organizer: 'Org',
    organizerSlug: 'org',
    endDate: overrides.startDate,
    price: 100,
    currency: 'TRY',
    isFree: false,
    attendees: 0,
    capacity: 100,
    tags: [],
    isFeatured: false,
    isTrending: false,
    isOnline: false,
    listingType: 'internal',
    status: 'published',
    ...overrides
  };
}

describe('sortEvents relevance', () => {
  it('uses startDate asc as tiebreaker when interest signals match', () => {
    const events = [
      makeEvent({ id: 'late', startDate: '2026-08-01T20:00:00Z', attendees: 10 }),
      makeEvent({ id: 'early', startDate: '2026-07-01T20:00:00Z', attendees: 10 }),
      makeEvent({ id: 'mid', startDate: '2026-07-15T20:00:00Z', attendees: 10 })
    ];

    const sorted = sortEvents(events, 'relevance');
    expect(sorted.map((e) => e.id)).toEqual(['early', 'mid', 'late']);
  });

  it('prioritizes trending and featured before dates', () => {
    const events = [
      makeEvent({ id: 'plain-late', startDate: '2026-09-01T20:00:00Z' }),
      makeEvent({
        id: 'trending-early',
        startDate: '2026-06-01T20:00:00Z',
        isTrending: true
      }),
      makeEvent({
        id: 'featured-mid',
        startDate: '2026-07-01T20:00:00Z',
        isFeatured: true
      })
    ];

    const sorted = sortEvents(events, 'relevance');
    expect(sorted.map((e) => e.id)).toEqual([
      'trending-early',
      'featured-mid',
      'plain-late'
    ]);
  });
});
