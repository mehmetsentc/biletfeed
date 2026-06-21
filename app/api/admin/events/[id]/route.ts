import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminUnauthorized, requireAdminSession } from '@/lib/auth/admin-api';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { eventInclude, toMockEvent } from '@/lib/mappers/event';
import { resolveCitySlug } from '@/lib/scraper/normalize';

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(10).optional(),
  shortDescription: z.string().max(200).optional(),
  coverImage: z.string().url().optional(),
  venue: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  cityName: z.string().max(80).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  basePrice: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
  externalUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional()
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAdminSession();
  if (!session) return adminUnauthorized();

  const { id } = await params;
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null },
    include: eventInclude
  });

  if (!event) {
    return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 });
  }

  return NextResponse.json({ event: toMockEvent(event) });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireAdminSession();
  if (!session) return adminUnauthorized();

  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  await ensureDbConnection();

  const existing = await prisma.event.findFirst({
    where: { id, deletedAt: null },
    include: { city: true, venue: true }
  });

  if (!existing) {
    return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 });
  }

  const data = parsed.data;
  let cityId = existing.cityId;
  let venueId = existing.venueId;

  if (data.cityName) {
    const { slug, name } = resolveCitySlug(data.cityName);
    let city = await prisma.city.findUnique({ where: { slug } });
    if (!city) {
      city = await prisma.city.create({
        data: { slug, name, country: 'Türkiye' }
      });
    }
    cityId = city.id;
  }

  if (data.venue) {
    const citySlug =
      data.cityName
        ? resolveCitySlug(data.cityName).slug
        : existing.city.slug;
    const venueSlug = `${citySlug}-${data.venue
      .toLowerCase()
      .replace(/\s+/g, '-')
      .slice(0, 64)}`;
    let venue = await prisma.venue.findUnique({ where: { slug: venueSlug } });
    if (!venue) {
      venue = await prisma.venue.create({
        data: {
          slug: venueSlug,
          name: data.venue,
          address: data.address || data.venue,
          cityId
        }
      });
    } else if (data.address) {
      venue = await prisma.venue.update({
        where: { id: venue.id },
        data: { address: data.address, name: data.venue }
      });
    }
    venueId = venue.id;
  }

  const tags = data.tags ?? existing.tags;
  const cleanedTags = tags.filter(
    (t) => t !== 'eksik-gorsel' && t !== 'eksik-aciklama'
  );

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.shortDescription !== undefined && {
        shortDescription: data.shortDescription
      }),
      ...(data.coverImage && { coverImage: data.coverImage }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
      ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
      ...(data.isFree !== undefined && { isFree: data.isFree }),
      ...(data.externalUrl && { externalUrl: data.externalUrl }),
      cityId,
      venueId,
      tags: cleanedTags
    },
    include: eventInclude
  });

  return NextResponse.json({ event: toMockEvent(updated) });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAdminSession();
  if (!session) return adminUnauthorized();

  const { id } = await params;
  await ensureDbConnection();

  await prisma.event.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'draft' }
  });

  return NextResponse.json({ ok: true });
}
