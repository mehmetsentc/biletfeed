import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { uploadArtistImage, isFirebaseStorageUploadConfigured } from '@/lib/firebase/admin-storage';
import { assertImageUpload } from '@/lib/security/image-upload';
import { updateArtist } from '@/lib/services/artist';

const MAX_BYTES = 5 * 1024 * 1024;

/** POST /api/artists/[id]/image — Upload artist profile image */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }
  const ctx = await requireOrganizerSession();
  if (!ctx) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  if (!isFirebaseStorageUploadConfigured()) {
    return NextResponse.json({ error: 'Storage yapılandırılmamış' }, { status: 503 });
  }

  const { id } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });

    const kindRaw = String(formData.get('kind') ?? 'image');
    const kind =
      kindRaw === 'cover' || kindRaw === 'strip' || kindRaw === 'image' ? kindRaw : 'image';

    const contentType = file.type || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Sadece görsel yüklenebilir' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: 'Dosya 5 MB sınırını aşıyor' }, { status: 400 });
    }

    const verifiedType = assertImageUpload(buffer, contentType);
    const url = await uploadArtistImage(id, buffer, verifiedType);

    if (kind === 'cover') {
      await updateArtist(id, { coverImage: url });
    } else if (kind === 'strip') {
      await updateArtist(id, { stripImage: url });
    } else {
      await updateArtist(id, { image: url });
    }

    return NextResponse.json({ url, kind });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yükleme başarısız';
    const status = message.includes('Geçersiz') ? 400 : 500;
    if (status === 500) console.error('[artist/image]', err);
    return NextResponse.json({ error: message }, { status });
  }
}
