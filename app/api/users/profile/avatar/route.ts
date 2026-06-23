import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function resolveImageContentType(file: File): string | null {
  if (ALLOWED_TYPES.has(file.type)) return file.type;
  if (file.type.startsWith('image/')) return file.type;

  const name = file.name.toLowerCase();
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.heic') || name.endsWith('.heif')) return 'image/jpeg';

  return null;
}

function isFileLike(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    'arrayBuffer' in value &&
    typeof value.arrayBuffer === 'function'
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await verifySessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error('[avatar upload] formData', err);
    return NextResponse.json({ error: 'Dosya okunamadı' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!isFileLike(file)) {
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

  let photoURL: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    photoURL = await uploadUserAvatarFromBuffer(
      session.uid,
      buffer,
      contentType
    );
  } catch (err) {
    console.error('[avatar upload] storage', err);
    return NextResponse.json(
      { error: 'Dosya depolama alanına yüklenemedi' },
      { status: 502 }
    );
  }

  let displayName = session.email?.split('@')[0] || 'Kullanıcı';
  try {
    const { getAdminAuth } = await import('@/lib/firebase/admin');
    const fbUser = await getAdminAuth().getUser(session.uid);
    if (fbUser.displayName?.trim()) {
      displayName = fbUser.displayName.trim();
    }
    await getAdminAuth().updateUser(session.uid, { photoURL });
  } catch (err) {
    console.error('[avatar upload] firebase auth profile', err);
  }

  try {
    const { saveUserAvatarPhoto } = await import('@/lib/services/user-avatar');
    const user = await saveUserAvatarPhoto(session, photoURL, displayName);
    return NextResponse.json({ user, photoURL });
  } catch (err) {
    console.error('[avatar upload] database', err);
    return NextResponse.json(
      { error: 'Profil kaydı güncellenemedi' },
      { status: 500 }
    );
  }
}
