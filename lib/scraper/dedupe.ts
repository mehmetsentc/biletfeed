import { createHash } from 'crypto';
import type { ExternalPlatform } from '@prisma/client';
import { PLATFORM_PRIORITY } from '@/lib/scraper/types';

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ıİ]/g, 'i')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[şŞ]/g, 's')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeVenue(venue: string): string {
  return normalizeTitle(venue);
}

export function buildDedupeHash(
  title: string,
  startDate: Date,
  citySlug: string,
  venue?: string
): string {
  const normalized = normalizeTitle(title);
  const dateKey = startDate.toISOString().slice(0, 10);
  const venueKey = venue?.trim() ? normalizeVenue(venue) : '';
  const payload = `${normalized}|${dateKey}|${citySlug.toLowerCase()}|${venueKey}`;
  return createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

function externalIdDuplicatesTitleSlug(titleSlug: string, externalIdSlug: string): boolean {
  if (!titleSlug || !externalIdSlug) return false;
  if (externalIdSlug === titleSlug) return true;
  if (externalIdSlug.endsWith(`-${titleSlug}`)) return true;
  if (titleSlug.endsWith(`-${externalIdSlug}`)) return true;
  return false;
}

export function slugifyExternal(
  platform: ExternalPlatform,
  externalId: string,
  title: string
): string {
  const base = normalizeTitle(title)
    .slice(0, 48)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const prefix = platform.toLowerCase().replace(/_/g, '-');
  const titleSlug = base || 'etkinlik';
  const safeId = externalId.replace(/[^\w-]/g, '').slice(0, 24);

  if (!safeId || externalIdDuplicatesTitleSlug(titleSlug, safeId)) {
    return `ext-${prefix}-${titleSlug}`.slice(0, 120);
  }

  return `ext-${prefix}-${titleSlug}-${safeId}`.slice(0, 120);
}

export function shouldReplaceExternalSource(
  current: ExternalPlatform | null | undefined,
  incoming: ExternalPlatform
): boolean {
  if (!current) return true;
  return PLATFORM_PRIORITY[incoming] < PLATFORM_PRIORITY[current];
}

export function pickBetterPlatform(
  a: ExternalPlatform,
  b: ExternalPlatform
): ExternalPlatform {
  return PLATFORM_PRIORITY[a] <= PLATFORM_PRIORITY[b] ? a : b;
}
