/**
 * AI etiketlerinde sık görülen yanlış yıl etiketlerini ucuzca temizler.
 * Örn. 2026’da yalnız “2019” / “2020” gibi bariz eski veya gelecek yıllar.
 */
export function sanitizeFeedTags(tags: string[] | null | undefined): string[] {
  if (!tags?.length) return [];
  const year = new Date().getFullYear();
  const minYear = year - 1;
  const maxYear = year + 2;

  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of tags) {
    const tag = raw.replace(/^#+/, '').trim();
    if (!tag) continue;

    const yearOnly = tag.match(/^(19|20)\d{2}$/);
    if (yearOnly) {
      const y = Number(yearOnly[0]);
      if (y < minYear || y > maxYear) continue;
    }

    const key = tag.toLocaleLowerCase('tr-TR');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= 12) break;
  }

  return out;
}
