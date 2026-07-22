import { describe, expect, it } from 'vitest';
import {
  isValidPhone,
  normalizePhone,
  sanitizePhoneInput
} from '@/lib/validation/phone';
import { validateCheckoutAttendee } from '@/lib/validation/checkout-attendee';

describe('normalizePhone / isValidPhone', () => {
  it('accepts Turkish mobile formats', () => {
    expect(normalizePhone('0555 888 51 60')).toBe('05558885160');
    expect(normalizePhone('5558885160')).toBe('05558885160');
    expect(normalizePhone('+905558885160')).toBe('05558885160');
    expect(isValidPhone('05558885160')).toBe(true);
  });

  it('accepts international E.164 numbers', () => {
    expect(normalizePhone('+49 170 1234567')).toBe('+491701234567');
    expect(normalizePhone('+1 (415) 555-2671')).toBe('+14155552671');
    expect(isValidPhone('+491701234567')).toBe(true);
    expect(isValidPhone('+14155552671')).toBe(true);
  });

  it('rejects too-short or invalid numbers', () => {
    expect(isValidPhone(normalizePhone('123'))).toBe(false);
    expect(isValidPhone('+0123')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });

  it('keeps + while typing', () => {
    expect(sanitizePhoneInput('+49')).toBe('+49');
    expect(sanitizePhoneInput('05xx')).toBe('05');
  });
});

describe('validateCheckoutAttendee phone', () => {
  const base = {
    attendeeName: 'Ali Veli',
    attendeeEmail: 'ali@ornek.com'
  };

  it('allows foreign phone on checkout', () => {
    const result = validateCheckoutAttendee({
      ...base,
      attendeePhone: '+49 170 1234567'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attendeePhone).toBe('+491701234567');
    }
  });

  it('still allows TR phone on checkout', () => {
    const result = validateCheckoutAttendee({
      ...base,
      attendeePhone: '0555 888 51 60'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attendeePhone).toBe('05558885160');
    }
  });
});
