/**
 * Feed yazısından etkinlik sayfası slug’ı — ilişki veya SEO alanından.
 */
export function resolveFeedEventSlug(input: {
  eventSlug?: string | null;
  eventId?: string | null;
  seo?: { [key: string]: unknown } | null;
}): string | null {
  if (input.eventSlug?.trim()) return input.eventSlug.trim();

  const seo = input.seo;
  if (!seo || typeof seo !== 'object') return null;

  for (const key of ['eventSlug', 'relatedEventSlug', 'event_slug'] as const) {
    const value = seo[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return null;
}
