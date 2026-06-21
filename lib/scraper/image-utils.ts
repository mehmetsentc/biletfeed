const PLACEHOLDER_PATTERNS = [
  'unsplash.com',
  'placeholder',
  'default-event',
  'no-image',
  'dummyimage.com'
];

export function isPlaceholderImage(url?: string | null): boolean {
  if (!url?.trim()) return true;
  const lower = url.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p));
}

export function pickBestImage(...candidates: (string | undefined | null)[]): string {
  for (const c of candidates) {
    if (c?.startsWith('http') && !isPlaceholderImage(c)) return c;
  }
  return '';
}
