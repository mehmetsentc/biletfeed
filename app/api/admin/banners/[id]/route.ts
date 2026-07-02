import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  adminForbidden,
  adminUnauthorized,
  requireAdminPermission
} from '@/lib/auth/admin-api';
import {
  softDeleteHomeBanner,
  updateHomeBanner
} from '@/lib/services/home-banners';

const patchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  subtitle: z.string().max(200).optional().nullable(),
  imageMobile: z.string().url().optional(),
  imageTablet: z.string().url().optional(),
  imageDesktop: z.string().url().optional(),
  linkUrl: z.string().max(500).optional().nullable(),
  eventId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireAdminPermission('banners.manage');
  if (!ctx) return adminForbidden();

  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    const banner = await updateHomeBanner(id, parsed.data);
    return NextResponse.json({ success: true, banner });
  } catch {
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireAdminPermission('banners.manage');
  if (!ctx) return adminUnauthorized();

  const { id } = await context.params;

  try {
    await softDeleteHomeBanner(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Silinemedi' }, { status: 500 });
  }
}
