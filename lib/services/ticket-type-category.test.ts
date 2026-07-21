import { describe, expect, it } from 'vitest';
import {
  inferTicketTypeEnum,
  isLocaTicketType,
  matchesSalesCategory
} from '@/lib/services/ticket-type-category';
import {
  entryCategoryLabel,
  resolveEntryCategory
} from '@/lib/tickets/entry-display';

describe('isLocaTicketType', () => {
  it('does not treat vip enum alone as loca', () => {
    expect(isLocaTicketType('vip', 'Standart')).toBe(false);
    expect(isLocaTicketType('vip', 'VIP')).toBe(false);
    expect(isLocaTicketType('backstage', 'Backstage')).toBe(false);
  });

  it('detects loca from category name', () => {
    expect(isLocaTicketType('general', 'Loca')).toBe(true);
    expect(isLocaTicketType('vip', 'VIP Loca')).toBe(true);
    expect(isLocaTicketType('general', 'Loğe 4 kişilik')).toBe(true);
  });
});

describe('matchesSalesCategory', () => {
  it('puts Standart under ticket even if stored as vip', () => {
    expect(matchesSalesCategory('vip', 'Standart', 'ticket')).toBe(true);
    expect(matchesSalesCategory('vip', 'Standart', 'loca')).toBe(false);
  });

  it('puts named loca under loca', () => {
    expect(matchesSalesCategory('general', 'Loca', 'loca')).toBe(true);
    expect(matchesSalesCategory('general', 'Loca', 'ticket')).toBe(false);
  });
});

describe('inferTicketTypeEnum', () => {
  it('infers from name not list order', () => {
    expect(inferTicketTypeEnum('Standart')).toBe('general');
    expect(inferTicketTypeEnum('Bistro')).toBe('general');
    expect(inferTicketTypeEnum('VIP')).toBe('vip');
    expect(inferTicketTypeEnum('Loca')).toBe('vip');
  });
});

describe('entry category display', () => {
  it('shows organizer category name on sold tickets', () => {
    expect(entryCategoryLabel(resolveEntryCategory('vip', 'Standart'), 'Standart')).toBe(
      'Standart'
    );
    expect(entryCategoryLabel(resolveEntryCategory('general', 'Bistro'), 'Bistro')).toBe(
      'Bistro'
    );
    expect(entryCategoryLabel(resolveEntryCategory('vip', 'VIP'), 'VIP')).toBe('VIP');
    expect(entryCategoryLabel(resolveEntryCategory('general', 'Loca'), 'Loca')).toBe('Loca');
  });
});
