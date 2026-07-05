import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { ensureOrganizerProfile } from '@/lib/services/organizer-onboarding';
import { updateOrganizerSettings } from '@/lib/services/organizer-panel';

const postSchema = z.object({
  organizationName: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(20).nullable().optional()
});

async function resolveUserFromSession() {
  const session = await verifySessionCookie();
  if (!session) return null;

  await ensureDbConnection();
  const user = await prisma.user.findFirst({
    where: { firebaseUid: session.uid, deletedAt: null },
    select: { id: true, email: true }
  });

  if (!user) return null;
  return { session, user };
}

export async function GET() {
  const ctx = await resolveUserFromSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  }

  const organizer = await prisma.organizer.findFirst({
    where: { ownerId: ctx.user.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      contactEmail: true,
      contactPhone: true
    }
  });

  return NextResponse.json({ organizer });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await resolveUserFromSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  }

  const json = await request.json();
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    const organizer = await ensureOrganizerProfile({
      userId: ctx.user.id,
      firebaseUid: ctx.session.uid,
      organizationName: parsed.data.organizationName,
      description: parsed.data.description
    });

    await updateOrganizerSettings(organizer.id, {
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone ?? null
    });

    const refreshed = await prisma.organizer.findUnique({
      where: { id: organizer.id },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        contactEmail: true,
        contactPhone: true
      }
    });

    return NextResponse.json({ success: true, organizer: refreshed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Başvuru gönderilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
