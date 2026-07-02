import { NextRequest, NextResponse } from 'next/server';
import { adminForbidden, requireAdminPermission } from '@/lib/auth/admin-api';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

/** Banner formu — yayında internal etkinlik arama */
export async function GET(request: NextRequest) {
  const ctx = await requireAdminPermission('banners.manage');
  if (!ctx) return adminForbidden();

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ events: [] });
  }

  await ensureDbConnection();
  const events = await prisma.event.findMany({
    where: {
      deletedAt: null,
      status: 'published',
      listingType: 'internal',
      title: { contains: q, mode: 'insensitive' }
    },
    select: { id: true, title: true, slug: true, coverImage: true },
    orderBy: { startDate: 'asc' },
    take: 10
  });

  return NextResponse.json({ events });
}
