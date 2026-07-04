import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'a',
  'h2',
  'h3',
  'h4',
  'blockquote'
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

/** Organizatör duyuru HTML — stored XSS önleme */
export function sanitizeOrganizerHtml(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  return DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false
  });
}

/** Düz metin alanları */
export function sanitizePlainText(raw: string, maxLength = 500): string {
  return raw
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    .trim()
    .slice(0, maxLength);
}
