import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  verifySessionCookie,
  buildSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_EXPIRES_MS
} from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/roles';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { ensureOrganizerProfile } from '@/lib/services/organizer-onboarding';
import { updateOrganizerSettings } from '@/lib/services/organizer-panel';
import { requireOrganizerApi } from '@/lib/auth/organizer-route';

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().max(20).nullable().optional(),
  notifyEmail: z.boolean().optional(),
  notifySms: z.boolean().optional(),
  socialLinks: z.record(z.string(), z.string()).optional()
});

const bodySchema = z.object({
  organizationName: z.string().min(2).max(120),
  description: z.string().max(500).optional()
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await verifySessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  await ensureDbConnection();
  const user = await prisma.user.findFirst({
    where: { firebaseUid: session.uid, deletedAt: null }
  });
  if (!user) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
  }

  try {
    const organizer = await ensureOrganizerProfile({
      userId: user.id,
      firebaseUid: session.uid,
      organizationName: parsed.data.organizationName,
      description: parsed.data.description
    });

    const response = NextResponse.json({ success: true, organizer });
    const refreshed = buildSessionCookie(
      session.uid,
      session.email ?? user.email,
      ROLES.ORGANIZER,
      SESSION_EXPIRES_MS
    );
    response.cookies.set(SESSION_COOKIE_NAME, refreshed, {
      maxAge: SESSION_EXPIRES_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kurulum başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const { error, ctx } = await requireOrganizerApi();
  if (error) return error;

  const json = await request.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    await updateOrganizerSettings(ctx.organizer.id, parsed.data);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kaydedilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  const session = await verifySessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  }

  await ensureDbConnection();
  const organizer = await prisma.organizer.findFirst({
    where: { owner: { firebaseUid: session.uid, deletedAt: null }, deletedAt: null }
  });

  return NextResponse.json({ organizer });
}
