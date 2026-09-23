import { describe, expect, it } from 'vitest';
import { partnerMarksForEventTitle } from '@/lib/tickets/print/partner-marks';

describe('organizatör şeridi', () => {
  it('Blok3 biletine dört organizatör koyar', () => {
    const marks = partnerMarksForEventTitle('BLOK3');
    expect(marks?.map((mark) => mark.name)).toEqual(['Major', 'PowerTürk', 'Let Us', 'On Stage']);
  });

  it('Zeynep Bastık biletine aynı şeridi koyar', () => {
    const marks = partnerMarksForEventTitle('Zeynep Bastık & Emir Can İğrek');
    expect(marks).toHaveLength(4);
  });

  it('diğer etkinliklerde şerit yoktur', () => {
    expect(partnerMarksForEventTitle('MANIFEST')).toBeNull();
    expect(partnerMarksForEventTitle('Zeynep')).toBeNull();
  });
});
