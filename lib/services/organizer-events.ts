import type { EventStatus, EventType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { uniqueSlug } from '@/lib/utils/slug';
import {
  buildEventExtrasData,
  type OrganizerEventExtras
} from '@/lib/organizator/event-metadata';
import { sessionSlugDateSuffix } from '@/lib/organizator/event-series-meta';
import { inferTicketTypeEnum } from '@/lib/services/ticket-type-category';

export interface TicketCategoryInput {
  id?: string;
  name: string;
  description?: string;
  price: number;
  capacity: number;
  /** Tek satın alımda QR / kişi sayısı (masa/loca) */
  seatsPerUnit?: number;
  showLowStockBadge?: boolean;
}

/** Eski kayıtlarda `ad — açıklama` birleşik olabilir; alanları ayırır. */
function normalizeTicketCategoryFields(cat: TicketCategoryInput): {
  name: string;
  description: string;
} {
  const sep = ' — ';
  const rawName = cat.name.trim();
  const idx = rawName.indexOf(sep);
  const cleanName = (idx >= 0 ? rawName.slice(0, idx) : rawName).trim();
  const fromName = idx >= 0 ? rawName.slice(idx + sep.length).trim() : '';
  const fromField = cat.description?.trim() ?? '';
  return {
    name: cleanName || rawName,
    description: fromField || fromName
  };
}

export interface CreateOrganizerEventInput extends OrganizerEventExtras {
  organizerId: string;
  title: string;
  description: string;
  categorySlug: string;
  citySlug: string;
  venueName?: string;
  venueAddress?: string;
  startDate: Date;
  endDate: Date;
  isFree: boolean;
  price: number;
  capacity: number;
  coverImage?: string;
  status?: EventStatus;
  eventType?: EventType;
  ticketCategories?: TicketCategoryInput[];
}

export interface EventSessionInput {
  startDate: Date;
  endDate: Date;
}

export type CreateOrganizerEventSeriesInput = Omit<
  CreateOrganizerEventInput,
  'startDate' | 'endDate' | 'seriesMeta'
> & {
  sessions: EventSessionInput[];
};

export interface UpdateOrganizerEventInput extends OrganizerEventExtras {
  organizerId: string;
  eventId: string;
  title?: string;
  description?: string;
  categorySlug?: string;
  citySlug?: string;
  venueName?: string;
  venueAddress?: string;
  startDate?: Date;
  endDate?: Date;
  isFree?: boolean;
  price?: number;
  capacity?: number;
  coverImage?: string;
  status?: EventStatus;
  ticketCategories?: TicketCategoryInput[];
}

async function resolveCityId(citySlug: string): Promise<string> {
  const city = await prisma.city.findFirst({
    where: { slug: citySlug, deletedAt: null }
  });
  if (!city) throw new Error('Şehir bulunamadı');
  return city.id;
}

async function resolveCategoryId(categorySlug: string): Promise<string> {
  const category = await prisma.category.findFirst({
    where: { slug: categorySlug, deletedAt: null }
  });
  if (!category) throw new Error('Kategori bulunamadı');
  return category.id;
}

async function resolveVenueId(params: {
  cityId: string;
  name?: string;
  address?: string;
}): Promise<string | null> {
  if (!params.name?.trim()) return null;

  const slug = await uniqueSlug(params.name, async (s) => {
    const row = await prisma.venue.findUnique({ where: { slug: s } });
    return Boolean(row);
  });

  const venue = await prisma.venue.upsert({
    where: { slug },
    create: {
      slug,
      name: params.name.trim(),
      address: params.address?.trim() || params.name.trim(),
      cityId: params.cityId
    },
    update: {
      name: params.name.trim(),
      address: params.address?.trim() || params.name.trim()
    }
  });

  return venue.id;
}

type CreateEventTxParams = {
  organizerId: string;
  title: string;
  description: string;
  categorySlug: string;
  citySlug: string;
  venueName?: string;
  venueAddress?: string;
  startDate: Date;
  endDate: Date;
  isFree: boolean;
  price: number;
  capacity: number;
  coverImage?: string;
  status?: EventStatus;
  eventType?: EventType;
  ticketCategories?: TicketCategoryInput[];
  extras: ReturnType<typeof buildEventExtrasData>;
  cityId: string;
  categoryId: string;
  venueId: string | null;
  slugBase: string;
};

async function createEventRecord(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  params: CreateEventTxParams
) {
  const price = params.isFree ? 0 : params.price;
  const now = new Date();

  const slug = await uniqueSlug(params.slugBase, async (s) => {
    const row = await tx.event.findUnique({ where: { slug: s } });
    return Boolean(row);
  });

  return tx.event.create({
    data: {
      slug,
      title: params.title.trim(),
      description: params.description.trim(),
      shortDescription: params.description.trim().slice(0, 160),
      organizerId: params.organizerId,
      cityId: params.cityId,
      categoryId: params.categoryId,
      venueId: params.venueId,
      coverImage:
        params.coverImage?.trim() ||
        'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200',
      gallery: [],
      startDate: params.startDate,
      endDate: params.endDate,
      status: params.status || 'draft',
      eventType: params.eventType || 'other',
      isFree: params.isFree,
      basePrice: price,
      capacity: params.capacity,
      listingType: 'internal',
      tags: params.extras.tags,
      rules: params.extras.rules,
      faqs: params.extras.faqs,
      seo: params.extras.seo,
      isOnline: params.extras.isOnline,
      onlineUrl: params.extras.onlineUrl,
      ticketTypes: {
        create: (params.ticketCategories && params.ticketCategories.length > 0
          ? params.ticketCategories.map((cat) => {
              const { name, description } = normalizeTicketCategoryFields(cat);
              return {
                name,
                description,
                type: inferTicketTypeEnum(name),
                price: params.isFree ? 0 : cat.price,
                currency: 'TRY',
                quantity: cat.capacity,
                sold: 0,
                capacity: cat.capacity,
                seatsPerUnit: Math.max(1, cat.seatsPerUnit ?? 1),
                saleStartDate: now,
                saleEndDate: params.startDate,
                status: 'active' as const,
                showLowStockBadge: cat.showLowStockBadge ?? false
              };
            })
          : [
              {
                name: 'Genel Giriş',
                type: 'general' as const,
                price,
                currency: 'TRY',
                quantity: params.capacity,
                sold: 0,
                capacity: params.capacity,
                saleStartDate: now,
                saleEndDate: params.startDate,
                status: 'active' as const
              }
            ])
      }
    },
    include: {
      city: true,
      venue: true,
      category: true,
      ticketTypes: true
    }
  });
}

export async function createOrganizerEvent(input: CreateOrganizerEventInput) {
  await ensureDbConnection();

  if (input.status === 'published') {
    throw new Error('Etkinlikleri doğrudan yayınlayamazsınız. Onaya gönderin.');
  }

  const [cityId, categoryId] = await Promise.all([
    resolveCityId(input.citySlug),
    resolveCategoryId(input.categorySlug)
  ]);

  const venueId = await resolveVenueId({
    cityId,
    name: input.venueName,
    address: input.venueAddress
  });

  const price = input.isFree ? 0 : input.price;
  const extras = buildEventExtrasData(input);

  return prisma.$transaction(async (tx) => {
    return createEventRecord(tx, {
      organizerId: input.organizerId,
      title: input.title,
      description: input.description,
      categorySlug: input.categorySlug,
      citySlug: input.citySlug,
      venueName: input.venueName,
      venueAddress: input.venueAddress,
      startDate: input.startDate,
      endDate: input.endDate,
      isFree: input.isFree,
      price,
      capacity: input.capacity,
      coverImage: input.coverImage,
      status: input.status,
      eventType: input.eventType,
      ticketCategories: input.ticketCategories,
      extras,
      cityId,
      categoryId,
      venueId,
      slugBase: input.title
    });
  });
}

export async function createOrganizerEventSeries(input: CreateOrganizerEventSeriesInput) {
  await ensureDbConnection();

  if (input.status === 'published') {
    throw new Error('Etkinlikleri doğrudan yayınlayamazsınız. Onaya gönderin.');
  }

  if (input.sessions.length < 2) {
    throw new Error('Tekrarlayan etkinlik için en az iki seans gerekli.');
  }

  const [cityId, categoryId] = await Promise.all([
    resolveCityId(input.citySlug),
    resolveCategoryId(input.categorySlug)
  ]);

  const venueId = await resolveVenueId({
    cityId,
    name: input.venueName,
    address: input.venueAddress
  });

  const price = input.isFree ? 0 : input.price;
  const seriesId = randomUUID();
  const sessionCount = input.sessions.length;

  return prisma.$transaction(async (tx) => {
    const events = [];

    for (let i = 0; i < input.sessions.length; i++) {
      const session = input.sessions[i];
      const extras = buildEventExtrasData({
        ...input,
        seriesMeta: {
          seriesId,
          sessionIndex: i + 1,
          sessionCount
        }
      });

      const event = await createEventRecord(tx, {
        organizerId: input.organizerId,
        title: input.title,
        description: input.description,
        categorySlug: input.categorySlug,
        citySlug: input.citySlug,
        venueName: input.venueName,
        venueAddress: input.venueAddress,
        startDate: session.startDate,
        endDate: session.endDate,
        isFree: input.isFree,
        price,
        capacity: input.capacity,
        coverImage: input.coverImage,
        status: input.status,
        eventType: input.eventType,
        ticketCategories: input.ticketCategories,
        extras,
        cityId,
        categoryId,
        venueId,
        slugBase: `${input.title} ${sessionSlugDateSuffix(session.startDate)}`
      });

      events.push(event);
    }

    return events;
  });
}

export async function updateOrganizerEvent(input: UpdateOrganizerEventInput) {
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: {
      id: input.eventId,
      organizerId: input.organizerId,
      deletedAt: null
    },
    include: {
      ticketTypes: { where: { deletedAt: null } }
    }
  });

  if (!event) throw new Error('Etkinlik bulunamadı');

  if (input.status === 'published') {
    throw new Error('Etkinlikleri doğrudan yayınlayamazsınız. Onaya gönderin.');
  }

  const cityId = input.citySlug
    ? await resolveCityId(input.citySlug)
    : event.cityId;
  const categoryId = input.categorySlug
    ? await resolveCategoryId(input.categorySlug)
    : event.categoryId;

  let venueId = event.venueId;
  if (input.venueName !== undefined) {
    venueId = await resolveVenueId({
      cityId,
      name: input.venueName,
      address: input.venueAddress
    });
  }

  const now = new Date();

  const extrasData: Record<string, unknown> = {};
  if (input.tags !== undefined) extrasData.tags = input.tags;
  if (input.rules !== undefined) extrasData.rules = input.rules.trim();
  if (input.isOnline !== undefined) extrasData.isOnline = input.isOnline;
  if (input.onlineUrl !== undefined) extrasData.onlineUrl = input.onlineUrl?.trim() || null;
  if (input.attendeeQuestions !== undefined) extrasData.faqs = input.attendeeQuestions;

  const hasSeoUpdate =
    input.performers !== undefined ||
    input.preventQuestionCopy !== undefined ||
    input.accessPassword !== undefined ||
    input.hiddenFromSearch !== undefined ||
    input.venueMapUrl !== undefined ||
    input.organizerTermsAccepted;

  if (hasSeoUpdate) {
    const built = buildEventExtrasData({
      performers: input.performers,
      preventQuestionCopy: input.preventQuestionCopy,
      accessPassword: input.accessPassword,
      hiddenFromSearch: input.hiddenFromSearch,
      venueDetail: input.venueDetail,
      venueMapUrl: input.venueMapUrl,
      rules: input.rules,
      organizerTermsAccepted: input.organizerTermsAccepted
    });
    const existingSeo =
      typeof event.seo === 'object' && event.seo !== null && !Array.isArray(event.seo)
        ? (event.seo as Record<string, unknown>)
        : {};
    extrasData.seo = { ...existingSeo, ...built.seo };
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.event.update({
      where: { id: input.eventId },
      data: {
        ...(input.title && { title: input.title.trim() }),
        ...(input.description && {
          description: input.description.trim(),
          shortDescription: input.description.trim().slice(0, 160)
        }),
        ...(input.startDate && { startDate: input.startDate }),
        ...(input.endDate && { endDate: input.endDate }),
        ...(input.isFree !== undefined && { isFree: input.isFree }),
        ...(input.price !== undefined && { basePrice: input.isFree ? 0 : input.price }),
        ...(input.capacity !== undefined && { capacity: input.capacity }),
        ...(input.coverImage && { coverImage: input.coverImage }),
        ...(input.status && { status: input.status }),
        ...extrasData,
        cityId,
        categoryId,
        venueId
      }
    });

    if (input.ticketCategories) {
      const keptIds = new Set<string>();

      for (const cat of input.ticketCategories) {
        const { name: ticketName, description: ticketDescription } =
          normalizeTicketCategoryFields(cat);
        const price = input.isFree ?? event.isFree ? 0 : cat.price;

        if (cat.id) {
          const existing = event.ticketTypes.find((t) => t.id === cat.id);
          if (!existing) continue;

          if (cat.capacity < existing.sold) {
            throw new Error(
              `"${ticketName}" kontenjanı satılan bilet sayısından (${existing.sold}) az olamaz`
            );
          }

          await tx.ticketType.update({
            where: { id: cat.id },
            data: {
              name: ticketName,
              description: ticketDescription,
              price,
              capacity: cat.capacity,
              quantity: cat.capacity,
              seatsPerUnit: Math.max(1, cat.seatsPerUnit ?? 1),
              type: inferTicketTypeEnum(ticketName),
              showLowStockBadge: cat.showLowStockBadge ?? false
            }
          });
          keptIds.add(cat.id);
        } else {
          const created = await tx.ticketType.create({
            data: {
              eventId: input.eventId,
              name: ticketName,
              description: ticketDescription,
              type: inferTicketTypeEnum(ticketName),
              price,
              currency: 'TRY',
              quantity: cat.capacity,
              sold: 0,
              capacity: cat.capacity,
              seatsPerUnit: Math.max(1, cat.seatsPerUnit ?? 1),
              saleStartDate: now,
              saleEndDate: input.endDate ?? event.endDate,
              status: 'active',
              showLowStockBadge: cat.showLowStockBadge ?? false
            }
          });
          keptIds.add(created.id);
        }
      }

      for (const ticket of event.ticketTypes) {
        if (keptIds.has(ticket.id) || ticket.sold > 0) continue;
        await tx.ticketType.update({
          where: { id: ticket.id },
          data: { deletedAt: now, status: 'paused' }
        });
      }
    }

    return tx.event.findUniqueOrThrow({
      where: { id: updated.id },
      include: {
        city: true,
        venue: true,
        category: true,
        ticketTypes: { where: { deletedAt: null } }
      }
    });
  });
}

export async function updateOrganizerEventStatus(
  organizerId: string,
  eventId: string,
  status: EventStatus
) {
  await ensureDbConnection();
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null }
  });
  if (!event) throw new Error('Etkinlik bulunamadı');

  if (status === 'published') {
    throw new Error('Etkinlikleri doğrudan yayınlayamazsınız. Onaya gönderin.');
  }

  return prisma.event.update({
    where: { id: eventId },
    data: { status }
  });
}

export async function listOrganizerEventsDetailed(organizerId: string) {
  await ensureDbConnection();

  const events = await prisma.event.findMany({
    where: { organizerId, deletedAt: null },
    include: {
      city: true,
      venue: true,
      category: true,
      ticketTypes: {
        where: { deletedAt: null },
        select: { sold: true, capacity: true, quantity: true }
      },
      _count: { select: { purchasedTickets: true, orders: true } }
    },
    orderBy: { startDate: 'desc' }
  });

  return events.map((event) => {
    const ticketCapacity = event.ticketTypes.reduce(
      (sum, t) => sum + (t.capacity || t.quantity),
      0
    );
    const ticketSold = event.ticketTypes.reduce((sum, t) => sum + t.sold, 0);

    return {
      ...event,
      ticketCapacity,
      ticketSold,
      displayId: event.id.replace(/-/g, '').slice(0, 5).toUpperCase()
    };
  });
}

