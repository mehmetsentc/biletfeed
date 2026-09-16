import { describe, expect, it } from 'vitest';
import {
  comboAllowsGateEvent,
  comboIssueTargets,
  comboTicketFullyUsed,
  isLegacyPerDayComboTickets,
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
  it('kombine + iki seans → tek etkinlikte kişi kadar QR (günler check-in)', () => {
    const targets = comboIssueTargets({
      ticketTypeName: 'Kombine',
      seatsPerUnit: 1,
      sessions: [oct3, oct4],
      fallback: oct3
    });
    expect(targets.map((t) => t.eventId)).toEqual(['e-3ekim']);
  });

  it('kombine iki kişilik paket → iki QR, ikisi de satın alınan güne bağlı', () => {
    const targets = comboIssueTargets({
      ticketTypeName: 'Kombine bilet',
      seatsPerUnit: 2,
      sessions: [oct3, oct4],
      fallback: oct3
    });
    expect(targets).toHaveLength(2);
    expect(targets.every((t) => t.eventId === 'e-3ekim')).toBe(true);
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
  const singleCombo = { eventId: 'e-3ekim', status: 'VALID', id: 't-combo' };

  it('eski kombine: kapı kilitliyse o günün biletini döner (USED olsa bile)', () => {
    expect(
      pickComboTicketForGate([oct3Used, oct4Valid], 'e-3ekim')?.id
    ).toBe('t3');
  });

  it('eski kombine: kapı kilitliyse diğer günün VALID biletine düşmez', () => {
    expect(
      pickComboTicketForGate([oct3Used, oct4Valid], 'e-3ekim')?.status
    ).toBe('USED');
  });

  it('yeni kombine: tek bilet kapı gününden farklı olsa da döner', () => {
    expect(pickComboTicketForGate([singleCombo], 'e-4ekim')?.id).toBe('t-combo');
  });

  it('kapı yoksa ilk VALID bileti seçer', () => {
    expect(pickComboTicketForGate([oct3Used, oct4Valid])?.id).toBe('t4');
  });

  it('eski kombine: istenilen günde bilet yoksa undefined', () => {
    expect(pickComboTicketForGate([oct3Valid, oct4Valid], 'e-5ekim')).toBeUndefined();
  });
});

describe('comboAllowsGateEvent', () => {
  const sessionIds = ['e-3ekim', 'e-4ekim'];

  it('aynı etkinlikte her zaman izin verir', () => {
    expect(
      comboAllowsGateEvent({
        ticketEventId: 'e-3ekim',
        gateEventId: 'e-3ekim',
        sessionEventIds: sessionIds,
        isComboSeries: false,
        isLegacyPerDayTickets: false
      })
    ).toBe(true);
  });

  it('yeni kombine: kardeş seans kapısına izin verir', () => {
    expect(
      comboAllowsGateEvent({
        ticketEventId: 'e-3ekim',
        gateEventId: 'e-4ekim',
        sessionEventIds: sessionIds,
        isComboSeries: true,
        isLegacyPerDayTickets: false
      })
    ).toBe(true);
  });

  it('eski kombine: kardeş seans kapısına izin vermez', () => {
    expect(
      comboAllowsGateEvent({
        ticketEventId: 'e-3ekim',
        gateEventId: 'e-4ekim',
        sessionEventIds: sessionIds,
        isComboSeries: true,
        isLegacyPerDayTickets: true
      })
    ).toBe(false);
  });

  it('kombine olmayan bilet kardeş seansa giremez', () => {
    expect(
      comboAllowsGateEvent({
        ticketEventId: 'e-3ekim',
        gateEventId: 'e-4ekim',
        sessionEventIds: sessionIds,
        isComboSeries: false,
        isLegacyPerDayTickets: false
      })
    ).toBe(false);
  });
});

describe('comboTicketFullyUsed', () => {
  it('tüm seanslarda VALID check-in varsa tükenmiş sayılır', () => {
    expect(
      comboTicketFullyUsed({
        sessionEventIds: ['e-3ekim', 'e-4ekim'],
        validCheckInEventIds: ['e-4ekim', 'e-3ekim']
      })
    ).toBe(true);
  });

  it('tek gün check-in ile tükenmez', () => {
    expect(
      comboTicketFullyUsed({
        sessionEventIds: ['e-3ekim', 'e-4ekim'],
        validCheckInEventIds: ['e-3ekim']
      })
    ).toBe(false);
  });
});

describe('isLegacyPerDayComboTickets', () => {
  it('farklı eventId’ler eski çok-QR kombine', () => {
    expect(
      isLegacyPerDayComboTickets([
        { eventId: 'e-3ekim' },
        { eventId: 'e-4ekim' }
      ])
    ).toBe(true);
  });

  it('aynı eventId tek QR kombine', () => {
    expect(
      isLegacyPerDayComboTickets([{ eventId: 'e-3ekim' }, { eventId: 'e-3ekim' }])
    ).toBe(false);
  });
});
