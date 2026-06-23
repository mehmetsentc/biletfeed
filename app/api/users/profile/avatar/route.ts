import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';

export const runtime = 'nodejs';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function resolveImageContentType(file: File): string | null {
  if (ALLOWED_TYPES.has(file.type)) return file.type;
  if (file.type.startsWith('image/')) return file.type;

  const name = file.name.toLowerCase();
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';

  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
    }

    const session = await verifySessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 });
    }

    const contentType = resolveImageContentType(file);
    if (!contentType) {
      return NextResponse.json(
        { error: 'Sadece JPG, PNG veya WebP yükleyebilirsiniz' },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Dosya 2 MB\'dan küçük olmalı' },
        { status: 400 }
      );
    }

    const { isFirebaseStorageUploadConfigured, uploadUserAvatarFromBuffer } =
      await import('@/lib/firebase/admin-storage');

    if (!isFirebaseStorageUploadConfigured()) {
      return NextResponse.json(
        { error: 'Profil fotoğrafı yükleme şu an kullanılamıyor' },
        { status: 503 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const photoURL = await uploadUserAvatarFromBuffer(
      session.uid,
      buffer,
      contentType
    );

    let displayName = session.email?.split('@')[0] || 'Kullanıcı';
    try {
      const { getAdminAuth } = await import('@/lib/firebase/admin');
      const fbUser = await getAdminAuth().getUser(session.uid);
      if (fbUser.displayName?.trim()) {
        displayName = fbUser.displayName.trim();
      }
      await getAdminAuth().updateUser(session.uid, { photoURL });
    } catch {
      /* Firebase Auth profili opsiyonel */
    }

    const email = session.email?.trim() || `${session.uid}@users.biletfeed.local`;
    const { prisma, ensureDbConnection } = await import('@/lib/db/prisma');
    const { bootstrapRoleForEmail } = await import('@/lib/auth/bootstrap-admins');

    await ensureDbConnection();
    const user = await prisma.user.upsert({
      where: { firebaseUid: session.uid },
      create: {
        firebaseUid: session.uid,
        email,
        displayName,
        photoURL,
        role: bootstrapRoleForEmail(email)
      },
      update: {
        email,
        displayName,
        photoURL
      },
      select: {
        email: true,
        displayName: true,
        photoURL: true,
        role: true
      }
    });

    return NextResponse.json({ user, photoURL });
  } catch (err) {
    console.error('[avatar upload]', err);
    return NextResponse.json(
      { error: 'Profil fotoğrafı yüklenemedi' },
      { status: 500 }
    );
  }
}
