import { ensureDbConnection, prisma } from '@/lib/db/prisma';
import {
  buildNewsletterDigestEmail,
  buildNewsletterDigestSubject,
  type NewsletterDigestEvent
} from '@/lib/email/newsletter-digest-template';
import { sendEmail } from '@/lib/email/resend';
import { upcomingStartFilter, internalPublishedFilter } from '@/lib/services/events';

const DEFAULT_DIGEST_DAYS = 7;
const NATIONAL_LIMIT = 8;
const CITY_LIMIT = 6;
const MIN_HOURS_BETWEEN_DIGESTS = 20;

function toDigestEvent(event: {
  title: string;
  slug: string;
  startDate: Date;
  coverImage: string;
  basePrice: number;
  isFree: boolean;
  city: { name: string };
  category: { name: string };
}): NewsletterDigestEvent {
  return {
    title: event.title,
    slug: event.slug,
    startDate: event.startDate,
    cityName: event.city.name,
    categoryName: event.category.name,
    coverImage: event.coverImage,
    basePrice: event.basePrice,
    isFree: event.isFree
  };
}

const upcomingEventSelect = {
  title: true,
  slug: true,
  startDate: true,
  coverImage: true,
  basePrice: true,
  isFree: true,
  city: { select: { name: true } },
  category: { select: { name: true } }
} as const;

/** Hoş geldin e-postası — yaklaşan öne çıkan etkinlikler */
export async function fetchUpcomingHighlightEvents(params: {
  citySlug?: string | null;
  nationalLimit?: number;
  cityLimit?: number;
}): Promise<{
  nationalEvents: NewsletterDigestEvent[];
  cityEvents: NewsletterDigestEvent[];
}> {
  await ensureDbConnection();

  const nationalLimit = params.nationalLimit ?? 5;
  const cityLimit = params.cityLimit ?? 4;

  const [nationalEvents, cityEvents] = await Promise.all([
    prisma.event.findMany({
      where: {
        ...internalPublishedFilter,
        ...upcomingStartFilter()
      },
      select: upcomingEventSelect,
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
      take: nationalLimit
    }),
    params.citySlug
      ? prisma.event.findMany({
          where: {
            ...internalPublishedFilter,
            ...upcomingStartFilter(),
            city: { slug: params.citySlug, deletedAt: null }
          },
          select: upcomingEventSelect,
          orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
          take: cityLimit
        })
      : Promise.resolve([])
  ]);

  return {
    nationalEvents: nationalEvents.map(toDigestEvent),
    cityEvents: cityEvents.map(toDigestEvent)
  };
}

async function fetchNewEvents(params: {
  since: Date;
  citySlug?: string | null;
  limit: number;
}): Promise<NewsletterDigestEvent[]> {
  const { since, citySlug, limit } = params;

  const events = await prisma.event.findMany({
    where: {
      ...internalPublishedFilter,
      ...upcomingStartFilter(),
      ...(citySlug ? { city: { slug: citySlug, deletedAt: null } } : {}),
      OR: [{ createdAt: { gte: since } }, { updatedAt: { gte: since } }]
    },
    select: {
      title: true,
      slug: true,
      startDate: true,
      coverImage: true,
      basePrice: true,
      isFree: true,
      city: { select: { name: true } },
      category: { select: { name: true } }
    },
    orderBy: [{ createdAt: 'desc' }, { startDate: 'asc' }],
    take: limit
  });

  return events.map(toDigestEvent);
}

function digestSince(lastSent: Date | null | undefined): Date {
  const fallback = new Date();
  fallback.setDate(fallback.getDate() - DEFAULT_DIGEST_DAYS);
  if (!lastSent) return fallback;
  return lastSent > fallback ? lastSent : fallback;
}

export interface SendNewsletterDigestsResult {
  sent: number;
  skipped: number;
  errors: string[];
}

export async function sendNewsletterDigests(): Promise<SendNewsletterDigestsResult> {
  await ensureDbConnection();

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' }
  });

  const result: SendNewsletterDigestsResult = {
    sent: 0,
    skipped: 0,
    errors: []
  };

  const minIntervalMs = MIN_HOURS_BETWEEN_DIGESTS * 60 * 60 * 1000;
  const now = Date.now();

  for (const subscriber of subscribers) {
    if (
      subscriber.lastDigestSentAt &&
      now - subscriber.lastDigestSentAt.getTime() < minIntervalMs
    ) {
      result.skipped += 1;
      continue;
    }

    const since = digestSince(subscriber.lastDigestSentAt);

    try {
      const [nationalEvents, cityEvents] = await Promise.all([
        fetchNewEvents({ since, limit: NATIONAL_LIMIT }),
        subscriber.citySlug
          ? fetchNewEvents({
              since,
              citySlug: subscriber.citySlug,
              limit: CITY_LIMIT
            })
          : Promise.resolve([])
      ]);

      if (nationalEvents.length === 0 && cityEvents.length === 0) {
        result.skipped += 1;
        continue;
      }

      const html = buildNewsletterDigestEmail({
        cityName: subscriber.cityName,
        citySlug: subscriber.citySlug,
        nationalEvents,
        cityEvents
      });

      const subject = buildNewsletterDigestSubject({
        cityName: subscriber.cityName,
        hasNational: nationalEvents.length > 0,
        hasCity: cityEvents.length > 0
      });

      const emailResult = await sendEmail({
        to: subscriber.email,
        subject,
        html,
        sender: 'noreply'
      });

      if (!emailResult.ok) {
        result.errors.push(
          `${subscriber.email}: ${emailResult.error ?? 'email_failed'}`
        );
        result.skipped += 1;
        continue;
      }

      await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: { lastDigestSentAt: new Date() }
      });

      result.sent += 1;
    } catch (e) {
      result.errors.push(
        `${subscriber.email}: ${e instanceof Error ? e.message : String(e)}`
      );
      result.skipped += 1;
    }
  }

  return result;
}
