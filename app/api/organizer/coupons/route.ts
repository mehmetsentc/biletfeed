import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import {
  createOrganizerCoupon,
  deactivateCoupon,
  listOrganizerCoupons
} from '@/lib/services/coupons';

const createSchema = z.object({
  code: z.string().min(2).max(30),
  assignedLabel: z.string().max(100).optional(),
  eventId: z.string().uuid().optional(),
  type: z.enum(['percent', 'fixed']),
  value: z.number().positive(),
  maxUses: z.number().int().positive().optional(),
  minOrder: z.number().min(0).optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime()
});

export async function GET(request: NextRequest) {
  const ctx = await requireOrganizerSession();
  if (!ctx) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const eventId = request.nextUrl.searchParams.get('eventId') ?? undefined;
  const coupons = await listOrganizerCoupons(ctx.organizer.id, eventId);
  return NextResponse.json({ coupons });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  try {
    const coupon = await createOrganizerCoupon({
      organizerId: ctx.organizer.id,
      ...parsed.data,
      validFrom: new Date(parsed.data.validFrom),
      validUntil: new Date(parsed.data.validUntil)
    });
    return NextResponse.json({ coupon });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Kupon oluşturulamadı' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const couponId = request.nextUrl.searchParams.get('id');
  if (!couponId) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });

  try {
    await deactivateCoupon(couponId, ctx.organizer.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'İşlem başarısız' },
      { status: 400 }
    );
  }
}
