import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

const ALLOWED_PHOTO_HOSTS = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com'
];

function isAllowedPhotoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_PHOTO_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

const bodySchema = z.object({
  photoURL: z
    .string()
    .url()
    .refine(isAllowedPhotoUrl, { message: 'Geçersiz fotoğraf URL' })
    .optional(),
  displayName: z.string().min(1).max(100).optional()
});

export async function PATCH(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
    }

    const session = await verifySessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    await ensureDbConnection();
    const user = await prisma.user.update({
      where: { firebaseUid: session.uid },
      data: parsed.data,
      select: {
        email: true,
        displayName: true,
        photoURL: true,
        role: true
      }
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Profil güncellenemedi' }, { status: 400 });
  }
}
