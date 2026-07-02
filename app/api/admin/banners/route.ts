import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  adminForbidden,
  adminUnauthorized,
  requireAdminPermission
} from '@/lib/auth/admin-api';
import {
  createHomeBanner,
  listHomeBannersAdmin
} from '@/lib/services/home-banners';

const createSchema = z.object({
  title: z.string().min(1).max(120),
  subtitle: z.string().max(200).optional().nullable(),
  imageMobile: z.string().url(),
  imageTablet: z.string().url(),
  imageDesktop: z.string().url(),
  linkUrl: z.string().max(500).optional().nullable(),
  eventId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

export async function GET() {
  const ctx = await requireAdminPermission('banners.manage');
  if (!ctx) return adminForbidden();

  try {
    const banners = await listHomeBannersAdmin();
    return NextResponse.json({ banners });
  } catch {
    return NextResponse.json({ error: 'Bannerlar yüklenemedi' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireAdminPermission('banners.manage');
  if (!ctx) return adminUnauthorized();

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    const banner = await createHomeBanner(parsed.data);
    return NextResponse.json({ success: true, banner });
  } catch {
    return NextResponse.json({ error: 'Banner oluşturulamadı' }, { status: 500 });
  }
}
