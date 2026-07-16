import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import {
  createScannerGateCode,
  listScannerGateCodes,
  pruneStaleScannerGateCodes,
  SCANNER_GATE_CODE_TTL_SEC,
  SCANNER_GATE_MAX_ACTIVE_CODES
} from '@/lib/auth/scanner-gate';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

const postSchema = z.object({
  eventId: z.string().uuid('Geçerli bir etkinlik seçin')
});

export async function GET() {
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const codes = await listScannerGateCodes(ctx.organizer.id);

  return NextResponse.json({
    codes,
    maxActiveCodes: SCANNER_GATE_MAX_ACTIVE_CODES,
    ttlHours: SCANNER_GATE_CODE_TTL_SEC / 3600
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Etkinlik seçin' },
      { status: 400 }
    );
  }

  await ensureDbConnection();
  const event = await prisma.event.findFirst({
    where: {
      id: parsed.data.eventId,
      organizerId: ctx.organizer.id,
      deletedAt: null,
      status: { in: ['published', 'completed'] }
    },
    select: { id: true, title: true }
  });

  if (!event) {
    return NextResponse.json(
      { error: 'Etkinlik bulunamadı veya kapı kodu için uygun değil' },
      { status: 400 }
    );
  }

  try {
    const created = await createScannerGateCode({
      organizerId: ctx.organizer.id,
      eventId: event.id,
      uid: ctx.session.uid,
      email: ctx.user.email,
      role: ctx.session.role
    });

    return NextResponse.json({
      pin: created.pin,
      redeemCode: created.redeemCode,
      code: created.redeemCode,
      eventId: created.eventId,
      eventTitle: event.title,
      expiresAt: created.expiresAt.toISOString(),
      maxActiveCodes: SCANNER_GATE_MAX_ACTIVE_CODES,
      ttlHours: SCANNER_GATE_CODE_TTL_SEC / 3600
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Kapı kodu oluşturulamadı';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const result = await pruneStaleScannerGateCodes(ctx.organizer.id);
  const codes = await listScannerGateCodes(ctx.organizer.id);

  return NextResponse.json({
    ...result,
    codes,
    maxActiveCodes: SCANNER_GATE_MAX_ACTIVE_CODES,
    ttlHours: SCANNER_GATE_CODE_TTL_SEC / 3600
  });
}
