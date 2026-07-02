import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export type CouponDiscount = {
  couponId: string;
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
};

export async function validateCoupon(params: {
  code: string;
  eventId: string;
  organizerId: string;
  subtotal: number;
}): Promise<CouponDiscount> {
  await ensureDbConnection();
  const code = params.code.trim().toUpperCase();
  if (!code) throw new Error('Kupon kodu gerekli');

  const now = new Date();
  const coupon = await prisma.coupon.findFirst({
    where: {
      code,
      active: true,
      deletedAt: null,
      validFrom: { lte: now },
      validUntil: { gte: now },
      OR: [{ eventId: params.eventId }, { eventId: null }],
      organizerId: params.organizerId
    }
  });

  if (!coupon) throw new Error('Geçersiz veya süresi dolmuş kupon');
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    throw new Error('Kupon kullanım limitine ulaşıldı');
  }
  if (coupon.minOrder != null && params.subtotal < coupon.minOrder) {
    throw new Error(`Minimum sipariş tutarı: ${coupon.minOrder} ₺`);
  }

  let discount = 0;
  if (coupon.type === 'percent') {
    discount = Math.round(params.subtotal * (coupon.value / 100) * 100) / 100;
  } else {
    discount = Math.min(coupon.value, params.subtotal);
  }

  if (discount <= 0) throw new Error('Kupon indirimi uygulanamadı');

  return {
    couponId: coupon.id,
    code: coupon.code,
    discount,
    type: coupon.type as 'percent' | 'fixed'
  };
}

export async function incrementCouponUsage(couponId: string): Promise<void> {
  await ensureDbConnection();
  await prisma.coupon.update({
    where: { id: couponId },
    data: { usedCount: { increment: 1 } }
  });
}

export async function listOrganizerCoupons(organizerId: string, eventId?: string) {
  await ensureDbConnection();
  return prisma.coupon.findMany({
    where: {
      organizerId,
      deletedAt: null,
      ...(eventId ? { OR: [{ eventId }, { eventId: null }] } : {})
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getCouponLabelMap(
  organizerId: string,
  eventId?: string
): Promise<Map<string, string>> {
  await ensureDbConnection();
  const coupons = await prisma.coupon.findMany({
    where: {
      organizerId,
      deletedAt: null,
      ...(eventId ? { OR: [{ eventId }, { eventId: null }] } : {})
    },
    select: { code: true, assignedLabel: true }
  });
  const map = new Map<string, string>();
  for (const coupon of coupons) {
    if (coupon.assignedLabel) {
      map.set(coupon.code.toUpperCase(), coupon.assignedLabel);
    }
  }
  return map;
}

export async function createOrganizerCoupon(params: {
  organizerId: string;
  code: string;
  assignedLabel?: string;
  eventId?: string;
  type: 'percent' | 'fixed';
  value: number;
  maxUses?: number;
  minOrder?: number;
  validFrom: Date;
  validUntil: Date;
}) {
  await ensureDbConnection();
  const code = params.code.trim().toUpperCase();
  const assignedLabel = params.assignedLabel?.trim() || null;

  if (params.type === 'percent' && (params.value <= 0 || params.value > 100)) {
    throw new Error('Yüzde indirim 1–100 arasında olmalı');
  }
  if (params.type === 'fixed' && params.value <= 0) {
    throw new Error('Sabit indirim pozitif olmalı');
  }

  if (params.eventId) {
    const event = await prisma.event.findFirst({
      where: { id: params.eventId, organizerId: params.organizerId, deletedAt: null }
    });
    if (!event) throw new Error('Etkinlik bulunamadı');
  }

  return prisma.coupon.create({
    data: {
      code,
      assignedLabel,
      organizerId: params.organizerId,
      eventId: params.eventId ?? null,
      type: params.type,
      value: params.value,
      maxUses: params.maxUses ?? null,
      minOrder: params.minOrder ?? null,
      validFrom: params.validFrom,
      validUntil: params.validUntil
    }
  });
}

export async function deactivateCoupon(couponId: string, organizerId: string): Promise<void> {
  await ensureDbConnection();
  const coupon = await prisma.coupon.findFirst({
    where: { id: couponId, organizerId, deletedAt: null }
  });
  if (!coupon) throw new Error('Kupon bulunamadı');
  await prisma.coupon.update({
    where: { id: couponId },
    data: { active: false }
  });
}
