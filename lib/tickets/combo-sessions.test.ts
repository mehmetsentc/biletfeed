import { describe, expect, it } from 'vitest';
import {
  comboIssueTargets,
  pickComboTicketForGate
} from '@/lib/tickets/combo-sessions';

const oct3 = {
  eventId: 'e-3ekim',
  startDate: new Date('2026-10-03T19:00:00+03:00'),
  title: 'Konser 3 Ekim'
};
const oct4 = {
  eventId: 'e-4ekim',
  startDate: new Date('2026-10-04T19:00:00+03:00'),
  title: 'Konser 4 Ekim'
};

describe('comboIssueTargets', () => {
  it('kombine + iki seans → iki ayrı gün bileti', () => {
    const targets = comboIssueTargets({
      ticketTypeName: 'Kombine',
      seatsPerUnit: 2,
      sessions: [oct3, oct4],
      fallback: oct3
    });
    expect(targets.map((t) => t.eventId)).toEqual(['e-3ekim', 'e-4ekim']);
  });

  it('kombine adı seatsPerUnit=1 olsa da seans sayısı kadar bilet üretir', () => {
    const targets = comboIssueTargets({
      ticketTypeName: 'Kombine bilet',
      seatsPerUnit: 1,
      sessions: [oct3, oct4],
      fallback: oct3
    });
    expect(targets).toHaveLength(2);
  });

  it('masa paketi (kombine değil) aynı etkinlikte kişi kadar QR üretir', () => {
    const targets = comboIssueTargets({
      ticketTypeName: 'Loca 4 kişilik',
      seatsPerUnit: 4,
      sessions: [oct3, oct4],
      fallback: oct3
    });
    expect(targets).toHaveLength(4);
    expect(targets.every((t) => t.eventId === 'e-3ekim')).toBe(true);
  });

  it('kombine ama tek seans → seatsPerUnit kadar aynı gün QR', () => {
    const targets = comboIssueTargets({
      ticketTypeName: 'Kombine',
      seatsPerUnit: 2,
      sessions: [oct3],
      fallback: oct3
    });
    expect(targets).toHaveLength(2);
    expect(targets.every((t) => t.eventId === 'e-3ekim')).toBe(true);
  });
});

describe('pickComboTicketForGate', () => {
  const oct3Valid = { eventId: 'e-3ekim', status: 'VALID', id: 't3' };
  const oct4Valid = { eventId: 'e-4ekim', status: 'VALID', id: 't4' };
  const oct3Used = { eventId: 'e-3ekim', status: 'USED', id: 't3' };

  it('kapı kilitliyse o günün biletini döner (USED olsa bile)', () => {
    expect(
      pickComboTicketForGate([oct3Used, oct4Valid], 'e-3ekim')?.id
    ).toBe('t3');
  });

  it('kapı kilitliyse diğer günün VALID biletine düşmez', () => {
    expect(
      pickComboTicketForGate([oct3Used, oct4Valid], 'e-3ekim')?.status
    ).toBe('USED');
  });

  it('kapı yoksa ilk VALID bileti seçer', () => {
    expect(pickComboTicketForGate([oct3Used, oct4Valid])?.id).toBe('t4');
  });

  it('istenilen günde bilet yoksa undefined', () => {
    expect(pickComboTicketForGate([oct3Valid], 'e-4ekim')).toBeUndefined();
  });
});
