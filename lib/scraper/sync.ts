import { createHash } from 'crypto';
import type { ScrapeRunStatus } from '@prisma/client';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { dedupeEventsWithAi } from '@/lib/scraper/ai/dedupe-events';
import { isScraperAiReady } from '@/lib/scraper/ai/config';
import { isPlaceholderImage } from '@/lib/scraper/image-utils';
import {
  downloadAndUploadEventCover,
  isFirebaseStorageUploadConfigured
} from '@/lib/firebase/admin-storage';
import {
  buildDedupeHash,
  normalizeVenue,
  shouldReplaceExternalSource,
  slugifyExternal
} from '@/lib/scraper/dedupe';
import { scraperAdapters } from '@/lib/scraper/platforms';
import type { ScrapedEventRaw, ScraperResult } from '@/lib/scraper/types';

const AGGREGATOR_ORG_SLUG = 'biletfeed-aggregator';
const AGGREGATOR_USER_EMAIL = 'aggregator@biletfeed.local';

interface SyncStats {
  totalFetched: number;
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
  totalDeduped: number;
  errors: string[];
  platformStats: Record<string, { fetched: number; errors: number }>;
}

async function ensureAggregatorOrganizer() {
  let organizer = await prisma.organizer.findUnique({
    where: { slug: AGGREGATOR_ORG_SLUG }
  });

  if (organizer) return organizer;

  let user = await prisma.user.findUnique({
    where: { email: AGGREGATOR_USER_EMAIL }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        firebaseUid: 'system-event-aggregator',
        email: AGGREGATOR_USER_EMAIL,
        displayName: 'Bilet Feed Aggregator',
        role: 'ROLE_ORGANIZER'
      }
    });
  }

  organizer = await prisma.organizer.create({
    data: {
      slug: AGGREGATOR_ORG_SLUG,
      name: 'Bilet Feed',
      description: 'Harici platformlardan toplanan etkinlik listeleri.',
      status: 'approved',
      verified: true,
      ownerId: user.id
    }
  });

  return organizer;
}

async function resolveCityId(citySlug: string, cityName: string) {
  const slug = citySlug.toLowerCase();
  let city = await prisma.city.findUnique({ where: { slug } });
  if (city) return city.id;

  city = await prisma.city.create({
    data: {
      slug,
      name: cityName,
      country: slug === 'online' ? 'Online' : 'Türkiye'
    }
  });
  return city.id;
}

/** Scraper slug'larına karşılık gelen Türkçe kategori adları */
const CATEGORY_NAMES: Record<string, string> = {
  muzik: 'Konser',
  festival: 'Festival',
  tiyatro: 'Tiyatro',
  spor: 'Spor',
  teknoloji: 'Workshop',
  online: 'Online',
  sanat: 'Sanat',
  komedi: 'Komedi',
  cocuk: 'Çocuk',
};

async function resolveCategoryId(categorySlug: string) {
  const slug = categorySlug.toLowerCase();
  const name = CATEGORY_NAMES[slug] ?? (slug.charAt(0).toUpperCase() + slug.slice(1));
  // upsert: varsa adını düzelt (DB'de yanlış isim olabilir), yoksa oluştur
  const category = await prisma.category.upsert({
    where: { slug },
    update: { name },
    create: { slug, name }
  });
  return category.id;
}

function buildVenueSlug(citySlug: string, venueName: string): string {
  const base = normalizeVenue(venueName)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
  return `${citySlug}-${base || 'mekan'}`.slice(0, 120);
}

async function resolveVenueId(
  citySlug: string,
  cityId: string,
  venueName?: string,
  address?: string
): Promise<string | null> {
  const name = venueName?.trim();
  if (!name) return null;

  const slug = buildVenueSlug(citySlug, name);
  let venue = await prisma.venue.findUnique({ where: { slug } });

  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        slug,
        name,
        address: address?.trim() || name,
        cityId
      }
    });
  }

  return venue.id;
}

/** Scrape sonrası yaklaşan harici etkinlikleri ana sayfada öne çıkar */
async function promoteUpcomingExternalEvents() {
  const now = new Date();
  await prisma.event.updateMany({
    where: { listingType: 'external', deletedAt: null },
    data: { isFeatured: false, isTrending: false }
  });

  const upcoming = await prisma.event.findMany({
    where: {
      listingType: 'external',
      status: 'published',
      deletedAt: null,
      startDate: { gte: now }
    },
    orderBy: [{ lastScrapedAt: 'desc' }, { startDate: 'asc' }],
    take: 40,
    select: { id: true }
  });

  const featuredIds = upcoming.slice(0, 12).map((e) => e.id);
  const trendingIds = upcoming.slice(0, 24).map((e) => e.id);

  if (featuredIds.length) {
    await prisma.event.updateMany({
      where: { id: { in: featuredIds } },
      data: { isFeatured: true }
    });
  }
  if (trendingIds.length) {
    await prisma.event.updateMany({
      where: { id: { in: trendingIds } },
      data: { isTrending: true }
    });
  }
}

async function resolveCoverImage(
  raw: ScrapedEventRaw,
  eventKey: string
): Promise<{ coverImage: string; tags: string[] }> {
  const tags = [...(raw.tags || [])];
  const coverImage = raw.coverImage;

  if (isPlaceholderImage(coverImage)) {
    if (!tags.includes('eksik-gorsel')) tags.push('eksik-gorsel');
    return { coverImage: '/brand/favicon.png', tags };
  }

  if (isFirebaseStorageUploadConfigured() && coverImage?.startsWith('http')) {
    const uploaded = await downloadAndUploadEventCover(
      raw.platform,
      eventKey,
      coverImage
    );
    if (uploaded) {
      return { coverImage: uploaded, tags };
    }
    if (!tags.includes('eksik-gorsel')) tags.push('eksik-gorsel');
  }

  return {
    coverImage:
      coverImage && !isPlaceholderImage(coverImage)
        ? coverImage
        : '/brand/favicon.png',
    tags
  };
}

async function resolveUniqueSlug(
  baseSlug: string,
  externalId: string,
  title: string
): Promise<string> {
  const taken = await prisma.event.findFirst({ where: { slug: baseSlug } });
  if (!taken) return baseSlug;

  const idSuffix = externalId.replace(/[^\w-]/g, '').slice(0, 24);
  if (idSuffix) {
    const withId = `${baseSlug}-${idSuffix}`.slice(0, 120);
    const idTaken = await prisma.event.findFirst({ where: { slug: withId } });
    if (!idTaken) return withId;
  }

  for (let n = 2; n <= 50; n++) {
    const candidate = `${baseSlug}-${n}`.slice(0, 120);
    const exists = await prisma.event.findFirst({ where: { slug: candidate } });
    if (!exists) return candidate;
  }

  const hash = createHash('sha256')
    .update(`${baseSlug}|${externalId}|${title}`)
    .digest('hex')
    .slice(0, 8);
  return `${baseSlug.slice(0, 108)}-${hash}`.slice(0, 120);
}

async function upsertScrapedEvent(
  raw: ScrapedEventRaw,
  organizerId: string,
  stats: SyncStats
) {
  const dedupeHash = buildDedupeHash(
    raw.title,
    raw.startDate,
    raw.citySlug,
    raw.venue
  );

  const existingInternal = await prisma.event.findFirst({
    where: {
      dedupeHash,
      listingType: 'internal',
      deletedAt: null
    }
  });

  if (existingInternal) {
    stats.totalSkipped += 1;
    stats.totalDeduped += 1;
    return;
  }

  const existingExternal = await prisma.event.findFirst({
    where: {
      OR: [
        { dedupeHash },
        {
          externalPlatform: raw.platform,
          externalEventId: raw.externalId
        }
      ],
      listingType: 'external',
      deletedAt: null
    }
  });

  const cityId = await resolveCityId(raw.citySlug, raw.cityName);
  const categoryId = await resolveCategoryId(raw.categorySlug);
  const venueId = await resolveVenueId(
    raw.citySlug,
    cityId,
    raw.venue,
    raw.address
  );
  const now = new Date();
  const shortDescription =
    raw.shortDescription || raw.description.slice(0, 160);
  const eventKey = existingExternal?.id ?? `${raw.platform}-${raw.externalId}`;
  const { coverImage, tags } = await resolveCoverImage(raw, eventKey);

  if (existingExternal) {
    const replaceSource = shouldReplaceExternalSource(
      existingExternal.externalPlatform,
      raw.platform
    );

    if (!replaceSource) {
      stats.totalSkipped += 1;
      stats.totalDeduped += 1;
      await prisma.event.update({
        where: { id: existingExternal.id },
        data: { lastScrapedAt: now }
      });
      return;
    }

    await prisma.event.update({
      where: { id: existingExternal.id },
      data: {
        title: raw.title,
        description: raw.description,
        shortDescription,
        coverImage,
        gallery: raw.gallery || [],
        startDate: raw.startDate,
        endDate: raw.endDate,
        basePrice: raw.price,
        isFree: raw.isFree,
        tags,
        externalPlatform: raw.platform,
        externalUrl: raw.externalUrl,
        externalEventId: raw.externalId,
        lastScrapedAt: now,
        cityId,
        categoryId,
        venueId
      }
    });

    stats.totalUpdated += 1;
    return;
  }

  const finalSlug = await resolveUniqueSlug(
    slugifyExternal(raw.platform, raw.externalId, raw.title),
    raw.externalId,
    raw.title
  );

  const event = await prisma.event.create({
    data: {
      slug: finalSlug,
      title: raw.title,
      description: raw.description,
      shortDescription,
      organizerId,
      cityId,
      categoryId,
      venueId,
      coverImage,
      gallery: raw.gallery || [],
      startDate: raw.startDate,
      endDate: raw.endDate,
      status: 'published',
      eventType: raw.eventType,
      isOnline: raw.isOnline ?? false,
      isFeatured: false,
      isTrending: false,
      isFree: raw.isFree,
      basePrice: raw.price,
      currency: 'TRY',
      tags,
      listingType: 'external',
      externalPlatform: raw.platform,
      externalUrl: raw.externalUrl,
      externalEventId: raw.externalId,
      dedupeHash,
      lastScrapedAt: now
    }
  });

  await prisma.ticketType.create({
    data: {
      eventId: event.id,
      name: 'Harici Platform Bileti',
      type: 'general',
      price: raw.price,
      currency: 'TRY',
      quantity: 9999,
      capacity: 9999,
      saleStartDate: now,
      saleEndDate: raw.startDate,
      status: 'active'
    }
  });

  stats.totalCreated += 1;
}

function mergeScraperResult(stats: SyncStats, scraperResult: ScraperResult) {
  const key = scraperResult.platform;
  stats.platformStats[key] = stats.platformStats[key] || {
    fetched: 0,
    errors: 0
  };
  stats.platformStats[key].fetched += scraperResult.events.length;
  stats.platformStats[key].errors += scraperResult.errors.length;
  stats.totalFetched += scraperResult.events.length;
  stats.errors.push(...scraperResult.errors);
}

/** DB'deki kategori adlarını doğru Türkçe adlarla güncelle (her scrape'te çalışır) */
async function fixCategoryNames() {
  for (const [slug, name] of Object.entries(CATEGORY_NAMES)) {
    await prisma.category.updateMany({ where: { slug }, data: { name } });
  }
}

export async function runEventScrapeJob(): Promise<{
  runId: string;
  status: ScrapeRunStatus;
  stats: SyncStats;
}> {
  await ensureDbConnection();
  await fixCategoryNames(); // mevcut yanlış isimleri düzelt

  const run = await prisma.scrapeRun.create({
    data: { status: 'running' }
  });

  const stats: SyncStats = {
    totalFetched: 0,
    totalCreated: 0,
    totalUpdated: 0,
    totalSkipped: 0,
    totalDeduped: 0,
    errors: [],
    platformStats: {}
  };

  let status: ScrapeRunStatus = 'success';

  try {
    const organizer = await ensureAggregatorOrganizer();
    const allRaw: ScrapedEventRaw[] = [];

    for (const adapter of scraperAdapters) {
      const scraperResult = await adapter.scrapeNewEvents();
      mergeScraperResult(stats, scraperResult);
      allRaw.push(...scraperResult.events);
    }

    let batch = allRaw;
    if (isScraperAiReady() && process.env.SCRAPER_AI_DEDUPE === 'true') {
      const before = batch.length;
      batch = await dedupeEventsWithAi(batch);
      stats.totalDeduped += Math.max(0, before - batch.length);
      if (before !== batch.length) {
        stats.errors.push(`AI dedupe: ${before - batch.length} benzer kayıt birleştirildi`);
      }
    }

    // Dedupe within batch — keep best platform per hash
    const byHash = new Map<string, ScrapedEventRaw>();
    for (const raw of batch) {
      const hash = buildDedupeHash(
        raw.title,
        raw.startDate,
        raw.citySlug,
        raw.venue
      );
      const prev = byHash.get(hash);
      if (!prev) {
        byHash.set(hash, raw);
        continue;
      }
      stats.totalDeduped += 1;
      const keep =
        shouldReplaceExternalSource(prev.platform, raw.platform) ? raw : prev;
      byHash.set(hash, keep);
    }

    for (const raw of byHash.values()) {
      await upsertScrapedEvent(raw, organizer.id, stats);
    }

    await promoteUpcomingExternalEvents();

    if (stats.errors.length > 0 && stats.totalCreated + stats.totalUpdated === 0 && stats.totalSkipped === 0) {
      status = 'failed';
    } else if (stats.errors.length > 0) {
      status = 'partial';
    }
  } catch (e) {
    status = 'failed';
    stats.errors.push(e instanceof Error ? e.message : String(e));
  }

  await prisma.scrapeRun.update({
    where: { id: run.id },
    data: {
      status,
      finishedAt: new Date(),
      totalFetched: stats.totalFetched,
      totalCreated: stats.totalCreated,
      totalUpdated: stats.totalUpdated,
      totalSkipped: stats.totalSkipped,
      totalDeduped: stats.totalDeduped,
      errors: stats.errors,
      platformStats: stats.platformStats
    }
  });

  return { runId: run.id, status, stats };
}
