import { describe, expect, it } from 'vitest';
import {
  PRINT_TICKET_MAX,
  PRINT_TICKETS_PER_SHEET,
  formatPrintAttendeeName,
  formatPrintSequence,
  formatPrintSerial,
  groupIntoSheets,
  sequenceFromPrintAttendee
} from '@/lib/tickets/print/constants';

describe('baskı bilet sıra formatı', () => {
  it('sıra numarasını 6 haneye tamamlar', () => {
    expect(formatPrintSequence(1)).toBe('000001');
    expect(formatPrintSequence(500)).toBe('000500');
  });

  it('seri numarasını parti kimliği ile üretir', () => {
    expect(formatPrintSerial('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 42)).toBe('A1B2-0000042');
  });

  it('katılımcı adından sırayı geri okur', () => {
    expect(sequenceFromPrintAttendee(formatPrintAttendeeName(12))).toBe(12);
    expect(sequenceFromPrintAttendee('Ahmet Yılmaz')).toBeNull();
  });

  it('500 bileti sayfa başına 3 olacak şekilde böler', () => {
    const sheets = groupIntoSheets(Array.from({ length: PRINT_TICKET_MAX }, (_, i) => i + 1));
    expect(PRINT_TICKETS_PER_SHEET).toBe(3);
    expect(sheets).toHaveLength(167);
    expect(sheets[0]).toHaveLength(3);
    expect(sheets.at(-1)).toEqual([499, 500]);
  });
});
