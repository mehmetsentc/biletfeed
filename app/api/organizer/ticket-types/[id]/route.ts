import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

const patchSchema = z
  .object({
    showLowStockBadge: z.boolean().optional(),
    status: z.enum(['active', 'paused', 'sold_out']).optional()
  })
  .refine(
    (data) => data.showLowStockBadge !== undefined || data.status !== undefined,
    { message: 'Güncellenecek alan yok' }
  );

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await params;
  const json = await request.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  await ensureDbConnection();

  const ticketType = await prisma.ticketType.findFirst({
    where: {
      id,
      deletedAt: null,
      event: {
        organizerId: ctx.organizer.id,
        deletedAt: null
      }
    },
    select: { id: true }
  });

  if (!ticketType) {
    return NextResponse.json({ error: 'Bilet kategorisi bulunamadı' }, { status: 404 });
  }

  const updated = await prisma.ticketType.update({
    where: { id },
    data: {
      ...(parsed.data.showLowStockBadge !== undefined
        ? { showLowStockBadge: parsed.data.showLowStockBadge }
        : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {})
    },
    select: { id: true, showLowStockBadge: true, status: true }
  });

  return NextResponse.json({ ticketType: updated });
}
