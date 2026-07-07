import { NextRequest, NextResponse } from 'next/server';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { uploadAdminFeedMedia, isFirebaseStorageUploadConfigured } from '@/lib/firebase/admin-storage';
import { assertImageUpload } from '@/lib/security/image-upload';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const guard = await guardAdminMutation(request, 'feed.manage');
  if ('error' in guard) return guard.error;

  if (!isFirebaseStorageUploadConfigured()) {
    return NextResponse.json({ error: 'Storage yapılandırılmamış' }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    const contentType = file.type || 'application/octet-stream';
    const buffer = Buffer.from(await file.arrayBuffer());

    if (contentType.startsWith('image/')) {
      if (buffer.length > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Görsel 5 MB sınırını aşıyor' }, { status: 400 });
      }
      const verifiedType = assertImageUpload(buffer, contentType);
      const url = await uploadAdminFeedMedia(buffer, verifiedType);
      return NextResponse.json({ url, type: 'image' as const });
    }

    if (contentType.startsWith('video/')) {
      if (buffer.length > MAX_VIDEO_BYTES) {
        return NextResponse.json({ error: 'Video 30 MB sınırını aşıyor' }, { status: 400 });
      }
      const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!allowed.includes(contentType.split(';')[0] ?? '')) {
        return NextResponse.json({ error: 'Desteklenen formatlar: MP4, WebM' }, { status: 400 });
      }
      const url = await uploadAdminFeedMedia(buffer, contentType);
      return NextResponse.json({ url, type: 'video' as const });
    }

    return NextResponse.json({ error: 'Sadece görsel veya video yüklenebilir' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yükleme başarısız';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
