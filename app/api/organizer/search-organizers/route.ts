import { NextRequest, NextResponse } from 'next/server';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

/**
 * GET /api/organizer/search-organizers?q=...
 * Organizatör adı veya e-posta ile onaylı organizatörleri arar.
 * Transfer işlemi için kullanılır.
 */
export async function GET(request: NextRequest) {
  const ctx = await requireOrganizerSession();
  if (!ctx) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  await ensureDbConnection();

  const results = await prisma.organizer.findMany({
    where: {
      deletedAt: null,
      status: 'approved',
      id: { not: ctx.organizer.id },
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { owner: { email: { contains: q, mode: 'insensitive' } } }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      owner: { select: { email: true } }
    },
    take: 8,
    orderBy: { name: 'asc' }
  });

  return NextResponse.json({
    results: results.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      logo: o.logo ?? null,
      email: o.owner?.email ?? ''
    }))
  });
}
