import type { EventStatus, EventType } from '@prisma/client';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { uniqueSlug } from '@/lib/utils/slug';
import {
  buildEventExtrasData,
  type OrganizerEventExtras
} from '@/lib/organizator/event-metadata';

export interface TicketCategoryInput {
  id?: string;
  name: string;
  description?: string;
  price: number;
  capacity: number;
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

  const slug = await uniqueSlug(input.title, async (s) => {
    const row = await prisma.event.findUnique({ where: { slug: s } });
    return Boolean(row);
  });

  const price = input.isFree ? 0 : input.price;
  const now = new Date();
  const extras = buildEventExtrasData(input);

  return prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        slug,
        title: input.title.trim(),
        description: input.description.trim(),
        shortDescription: input.description.trim().slice(0, 160),
        organizerId: input.organizerId,
        cityId,
        categoryId,
        venueId,
        coverImage:
          input.coverImage?.trim() ||
          'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200',
        gallery: [],
        startDate: input.startDate,
        endDate: input.endDate,
        status: input.status || 'draft',
        eventType: input.eventType || 'other',
        isFree: input.isFree,
        basePrice: price,
        capacity: input.capacity,
        listingType: 'internal',
        tags: extras.tags,
        rules: extras.rules,
        faqs: extras.faqs,
        seo: extras.seo,
        isOnline: extras.isOnline,
        onlineUrl: extras.onlineUrl,
        ticketTypes: {
          create: (input.ticketCategories && input.ticketCategories.length > 0
            ? input.ticketCategories.map((cat, i) => {
                const desc = cat.description?.trim();
                const displayName = desc ? `${cat.name} — ${desc}` : cat.name;
                return {
                name: displayName,
                type: i === 0 ? ('general' as const) : ('vip' as const),
                price: input.isFree ? 0 : cat.price,
                currency: 'TRY',
                quantity: cat.capacity,
                sold: 0,
                capacity: cat.capacity,
                saleStartDate: now,
                saleEndDate: input.startDate,
                status: 'active' as const
              };
              })
            : [{
                name: 'Genel Giriş',
                type: 'general' as const,
                price,
                currency: 'TRY',
                quantity: input.capacity,
                sold: 0,
                capacity: input.capacity,
                saleStartDate: now,
                saleEndDate: input.startDate,
                status: 'active' as const
              }])
        }
      },
      include: {
        city: true,
        venue: true,
        category: true,
        ticketTypes: true
      }
    });

    return event;
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
  if (input.venueDetail !== undefined) extrasData.rules = input.venueDetail.trim();
  if (input.isOnline !== undefined) extrasData.isOnline = input.isOnline;
  if (input.onlineUrl !== undefined) extrasData.onlineUrl = input.onlineUrl?.trim() || null;
  if (input.attendeeQuestions !== undefined) extrasData.faqs = input.attendeeQuestions;

  const hasSeoUpdate =
    input.performers !== undefined ||
    input.preventQuestionCopy !== undefined ||
    input.accessPassword !== undefined ||
    input.hiddenFromSearch !== undefined ||
    input.organizerTermsAccepted;

  if (hasSeoUpdate) {
    const built = buildEventExtrasData({
      performers: input.performers,
      preventQuestionCopy: input.preventQuestionCopy,
      accessPassword: input.accessPassword,
      hiddenFromSearch: input.hiddenFromSearch,
      venueDetail: input.venueDetail,
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

      for (const [index, cat] of input.ticketCategories.entries()) {
        const displayName = cat.description?.trim()
          ? `${cat.name} — ${cat.description.trim()}`
          : cat.name;
        const price = input.isFree ?? event.isFree ? 0 : cat.price;

        if (cat.id) {
          const existing = event.ticketTypes.find((t) => t.id === cat.id);
          if (!existing) continue;

          if (cat.capacity < existing.sold) {
            throw new Error(
              `"${cat.name}" kontenjanı satılan bilet sayısından (${existing.sold}) az olamaz`
            );
          }

          await tx.ticketType.update({
            where: { id: cat.id },
            data: {
              name: displayName,
              description: cat.description?.trim() || '',
              price,
              capacity: cat.capacity,
              quantity: cat.capacity,
              type: index === 0 ? 'general' : 'vip'
            }
          });
          keptIds.add(cat.id);
        } else {
          const created = await tx.ticketType.create({
            data: {
              eventId: input.eventId,
              name: displayName,
              description: cat.description?.trim() || '',
              type: index === 0 ? 'general' : 'vip',
              price,
              currency: 'TRY',
              quantity: cat.capacity,
              sold: 0,
              capacity: cat.capacity,
              saleStartDate: now,
              saleEndDate: input.endDate ?? event.endDate,
              status: 'active'
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

