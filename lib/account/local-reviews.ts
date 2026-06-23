import type { UserReviewItem } from '@/lib/services/user-reviews';

const STORAGE_PREFIX = 'bf-local-reviews:';

export function loadLocalReviews(uid: string): UserReviewItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${uid}`);
    if (!raw) return [];
    return JSON.parse(raw) as UserReviewItem[];
  } catch {
    return [];
  }
}

export function saveLocalReview(uid: string, review: UserReviewItem) {
  if (typeof window === 'undefined') return;
  const existing = loadLocalReviews(uid);
  localStorage.setItem(
    `${STORAGE_PREFIX}${uid}`,
    JSON.stringify([review, ...existing])
  );
}
