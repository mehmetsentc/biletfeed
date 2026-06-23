import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getAdminAuth } from '@/lib/firebase/admin';
import {
  isFirebaseStorageUploadConfigured,
  uploadUserAvatarFromBuffer
} from '@/lib/firebase/admin-storage';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
    }

    const session = await verifySessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
    }

    if (!isFirebaseStorageUploadConfigured()) {
      return NextResponse.json(
        { error: 'Profil fotoğrafı yükleme şu an kullanılamıyor' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const photoURL = await uploadUserAvatarFromBuffer(
      session.uid,
      buffer,
      file.type
    );

    await ensureDbConnection();
    const user = await prisma.user.update({
      where: { firebaseUid: session.uid },
      data: { photoURL },
      select: {
        email: true,
        displayName: true,
        photoURL: true,
        role: true
      }
    });

    try {
      await getAdminAuth().updateUser(session.uid, { photoURL });
    } catch {
      // DB kaydı yeterli; Firebase Auth profili opsiyonel
    }

    return NextResponse.json({ user, photoURL });
  } catch {
    return NextResponse.json(
      { error: 'Profil fotoğrafı yüklenemedi' },
      { status: 500 }
    );
  }
}
