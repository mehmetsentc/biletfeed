import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { uploadOrganizerEventCover, isFirebaseStorageUploadConfigured } from '@/lib/firebase/admin-storage';
import { assertImageUpload } from '@/lib/security/image-upload';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  if (!isFirebaseStorageUploadConfigured()) {
    return NextResponse.json({ error: 'Storage yapılandırılmamış' }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    const contentType = file.type || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Sadece görsel yüklenebilir' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: 'Dosya 5 MB sınırını aşıyor' }, { status: 400 });
    }

    const verifiedType = assertImageUpload(buffer, contentType);

    const url = await uploadOrganizerEventCover(ctx.organizer.id, buffer, verifiedType);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yükleme başarısız';
    const status = message.includes('Geçersiz') || message.includes('uyuşmuyor') ? 400 : 500;
    if (status === 500) console.error('[upload-image]', err);
    return NextResponse.json({ error: message }, { status });
  }
}
