import { NextRequest, NextResponse } from 'next/server';
import { adminUnauthorized, requireAdminSession } from '@/lib/auth/admin-api';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { eventInclude, toMockEvent } from '@/lib/mappers/event';

export async function GET(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return adminUnauthorized();

  await ensureDbConnection();

  const { searchParams } = new URL(request.url);
  const needsReview = searchParams.get('needsReview') === '1';
  const platform = searchParams.get('platform');

  const events = await prisma.event.findMany({
    where: {
      deletedAt: null,
      listingType: 'external',
      ...(platform ? { externalPlatform: platform as never } : {}),
      ...(needsReview
        ? {
            OR: [
              { tags: { has: 'eksik-gorsel' } },
              { tags: { has: 'eksik-aciklama' } },
              { coverImage: { contains: 'favicon' } }
            ]
          }
        : {})
    },
    include: eventInclude,
    orderBy: [{ startDate: 'asc' }],
    take: 200
  });

  return NextResponse.json({
    events: events.map(toMockEvent),
    total: events.length
  });
}
