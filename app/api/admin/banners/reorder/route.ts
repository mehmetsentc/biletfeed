import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { adminForbidden, requireAdminPermission } from '@/lib/auth/admin-api';
import { reorderHomeBanners } from '@/lib/services/home-banners';

const schema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1)
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireAdminPermission('banners.manage');
  if (!ctx) return adminForbidden();

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    await reorderHomeBanners(parsed.data.orderedIds);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Sıralama kaydedilemedi' }, { status: 500 });
  }
}
