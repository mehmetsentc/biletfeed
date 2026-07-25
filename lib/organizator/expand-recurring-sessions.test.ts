import { describe, expect, it } from 'vitest';
import { expandRecurringSessions } from '@/lib/organizator/expand-recurring-sessions';

describe('expandRecurringSessions', () => {
  it('expands a date range into daily sessions', () => {
    const result = expandRecurringSessions([
      {
        id: 'a',
        startDate: '2026-08-01',
        endDate: '2026-08-03',
        startTime: '20:00',
        endTime: '23:00'
      }
    ]);

    expect(result).toHaveLength(3);
    expect(result.map((s) => s.startDate)).toEqual([
      '2026-08-01',
      '2026-08-02',
      '2026-08-03'
    ]);
    expect(result.every((s) => s.startTime === '20:00')).toBe(true);
    expect(result.every((s) => s.endDate === s.startDate)).toBe(true);
  });

  it('keeps a single-day row as one session', () => {
    const result = expandRecurringSessions([
      {
        id: 'a',
        startDate: '2026-08-01',
        endDate: '',
        startTime: '20:00',
        endTime: '22:00'
      }
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].startDate).toBe('2026-08-01');
  });

  it('does not expand festival sessions by end date', () => {
    const result = expandRecurringSessions(
      [
        {
          id: 'a',
          startDate: '2026-08-01',
          endDate: '2026-08-03',
          startTime: '12:00',
          endTime: '23:00'
        }
      ],
      { isFestival: true }
    );
    expect(result).toHaveLength(1);
    expect(result[0].endDate).toBe('2026-08-03');
  });

  it('merges multiple manual rows after expansion', () => {
    const result = expandRecurringSessions([
      {
        id: 'a',
        startDate: '2026-08-01',
        endDate: '2026-08-02',
        startTime: '20:00',
        endTime: ''
      },
      {
        id: 'b',
        startDate: '2026-08-10',
        endDate: '',
        startTime: '21:00',
        endTime: '23:00'
      }
    ]);
    expect(result).toHaveLength(3);
    expect(result.map((s) => s.startDate)).toEqual([
      '2026-08-01',
      '2026-08-02',
      '2026-08-10'
    ]);
  });
});
