import { describe, expect, it } from 'vitest';
import { isUpcomingEvent, upcomingStartFilter } from './upcoming';

describe('isUpcomingEvent', () => {
  it('returns true when start is in the future', () => {
    const now = new Date('2026-07-04T10:00:00.000Z');
    const event = { startDate: '2026-07-04T21:30:00.000Z' };
    expect(isUpcomingEvent(event, now)).toBe(true);
  });

  it('returns false when start is in the past', () => {
    const now = new Date('2026-07-04T22:00:00.000Z');
    const event = { startDate: '2026-07-04T21:30:00.000Z' };
    expect(isUpcomingEvent(event, now)).toBe(false);
  });

  it('returns false for invalid dates', () => {
    expect(isUpcomingEvent({ startDate: 'invalid' })).toBe(false);
  });
});

describe('upcomingStartFilter', () => {
  it('uses provided now for prisma filter', () => {
    const now = new Date('2026-07-04T12:00:00');
    expect(upcomingStartFilter(now)).toEqual({ startDate: { gte: now } });
  });
});
