const MONTHS_TR = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
] as const;

export function formatFeedTimelineDate(iso: string | null): string {
  if (!iso) return 'Yakında';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Yakında';

  const day = date.getDate();
  const month = MONTHS_TR[date.getMonth()];
  const year = date.getFullYear();
  const now = new Date();

  if (date.getFullYear() === now.getFullYear()) {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${year}`;
}

export function formatFeedTimeLabel(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Az önce';
  if (diffHours < 24) return `${diffHours} sa önce`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} gün önce`;
  return formatFeedTimelineDate(iso);
}

export function groupFeedPostsByDate<T extends { publishedAt: string | null }>(
  posts: T[]
): Array<{ label: string; posts: T[] }> {
  const groups = new Map<string, T[]>();

  for (const post of posts) {
    const key = post.publishedAt?.slice(0, 10) ?? 'yakinda';
    const existing = groups.get(key) ?? [];
    existing.push(post);
    groups.set(key, existing);
  }

  return Array.from(groups.entries()).map(([key, items]) => ({
    label: key === 'yakinda' ? 'Yakında' : formatFeedTimelineDate(`${key}T12:00:00`),
    posts: items
  }));
}
