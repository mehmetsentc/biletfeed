import { describe, expect, it } from 'vitest';
import { sanitizeOrganizerHtml, sanitizePlainText } from './sanitize-html';

describe('sanitizeOrganizerHtml', () => {
  it('strips script tags', () => {
    const input = '<p>Merhaba</p><script>alert(1)</script>';
    expect(sanitizeOrganizerHtml(input)).toBe('<p>Merhaba</p>');
  });

  it('blocks javascript links', () => {
    const input = '<a href="javascript:alert(1)">tıkla</a>';
    expect(sanitizeOrganizerHtml(input)).not.toContain('javascript:');
  });

  it('allows safe formatting', () => {
    const input = '<p><strong>Önemli</strong> kural</p>';
    expect(sanitizeOrganizerHtml(input)).toContain('<strong>Önemli</strong>');
  });
});

describe('sanitizePlainText', () => {
  it('trims and limits length', () => {
    expect(sanitizePlainText('  başlık  ', 10)).toBe('başlık');
  });
});
