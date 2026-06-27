import type { EventStatus, EventType } from '@prisma/client';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { uniqueSlug } from '@/lib/utils/slug';

export interface TicketCategoryInput {
  name: string;
  description?: string;
  price: number;
  capacity: number;
}

export interface CreateOrganizerEventInput {
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
        ticketTypes: {
          create: (input.ticketCategories && input.ticketCategories.length > 0
            ? input.ticketCategories.map((cat, i) => ({
                name: cat.name,
                type: i === 0 ? ('general' as const) : ('vip' as const),
                price: input.isFree ? 0 : cat.price,
                currency: 'TRY',
                quantity: cat.capacity,
                sold: 0,
                capacity: cat.capacity,
                description: cat.description?.trim() || '',
                saleStartDate: now,
                saleEndDate: input.startDate,
                status: 'active' as const
              }))
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

