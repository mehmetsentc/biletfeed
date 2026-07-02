import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export type HomeBannerRecord = {
  id: string;
  title: string;
  subtitle: string | null;
  imageMobile: string;
  imageTablet: string;
  imageDesktop: string;
  linkUrl: string | null;
  eventId: string | null;
  eventSlug: string | null;
  sortOrder: number;
  isActive: boolean;
};

function mapBanner(row: {
  id: string;
  title: string;
  subtitle: string | null;
  imageMobile: string;
  imageTablet: string;
  imageDesktop: string;
  linkUrl: string | null;
  eventId: string | null;
  sortOrder: number;
  isActive: boolean;
  event?: { slug: string } | null;
}): HomeBannerRecord {
  const eventSlug = row.event?.slug ?? null;
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    imageMobile: row.imageMobile,
    imageTablet: row.imageTablet,
    imageDesktop: row.imageDesktop,
    linkUrl: row.linkUrl ?? (eventSlug ? `/etkinlik/${eventSlug}` : null),
    eventId: row.eventId,
    eventSlug,
    sortOrder: row.sortOrder,
    isActive: row.isActive
  };
}

const bannerSelect = {
  id: true,
  title: true,
  subtitle: true,
  imageMobile: true,
  imageTablet: true,
  imageDesktop: true,
  linkUrl: true,
  eventId: true,
  sortOrder: true,
  isActive: true,
  event: { select: { slug: true } }
} as const;

/** Ana sayfa — yalnızca aktif bannerlar */
export async function getActiveHomeBanners(): Promise<HomeBannerRecord[]> {
  try {
    await ensureDbConnection();
    const rows = await prisma.homeBanner.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: bannerSelect
    });
    return rows.map(mapBanner);
  } catch {
    return [];
  }
}

/** Admin — tüm bannerlar */
export async function listHomeBannersAdmin(): Promise<HomeBannerRecord[]> {
  await ensureDbConnection();
  const rows = await prisma.homeBanner.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: bannerSelect
  });
  return rows.map(mapBanner);
}

export type CreateHomeBannerInput = {
  title: string;
  subtitle?: string | null;
  imageMobile: string;
  imageTablet: string;
  imageDesktop: string;
  linkUrl?: string | null;
  eventId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export async function createHomeBanner(input: CreateHomeBannerInput) {
  await ensureDbConnection();
  const maxOrder = await prisma.homeBanner.aggregate({
    where: { deletedAt: null },
    _max: { sortOrder: true }
  });
  const row = await prisma.homeBanner.create({
    data: {
      title: input.title,
      subtitle: input.subtitle ?? null,
      imageMobile: input.imageMobile,
      imageTablet: input.imageTablet,
      imageDesktop: input.imageDesktop,
      linkUrl: input.linkUrl?.trim() || null,
      eventId: input.eventId ?? null,
      sortOrder: input.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
      isActive: input.isActive ?? true
    },
    select: bannerSelect
  });
  return mapBanner(row);
}

export type UpdateHomeBannerInput = Partial<CreateHomeBannerInput>;

export async function updateHomeBanner(id: string, input: UpdateHomeBannerInput) {
  await ensureDbConnection();
  const row = await prisma.homeBanner.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.subtitle !== undefined ? { subtitle: input.subtitle } : {}),
      ...(input.imageMobile !== undefined ? { imageMobile: input.imageMobile } : {}),
      ...(input.imageTablet !== undefined ? { imageTablet: input.imageTablet } : {}),
      ...(input.imageDesktop !== undefined ? { imageDesktop: input.imageDesktop } : {}),
      ...(input.linkUrl !== undefined
        ? { linkUrl: input.linkUrl?.trim() || null }
        : {}),
      ...(input.eventId !== undefined ? { eventId: input.eventId } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
    },
    select: bannerSelect
  });
  return mapBanner(row);
}

export async function softDeleteHomeBanner(id: string) {
  await ensureDbConnection();
  await prisma.homeBanner.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false }
  });
}

export async function reorderHomeBanners(orderedIds: string[]) {
  await ensureDbConnection();
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.homeBanner.update({
        where: { id },
        data: { sortOrder: index }
      })
    )
  );
}
