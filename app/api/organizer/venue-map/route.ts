import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { resolveOrganizerSession } from '@/lib/auth/organizer-api';
import { uploadVenueMapImage } from '@/lib/firebase/admin-storage';
import { assertImageUpload, detectImageMime } from '@/lib/security/image-upload';
import { rateLimitOrNullAsync } from '@/lib/security/rate-limit';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const limited = await rateLimitOrNullAsync(request, 'organizer-venue-map', 20, 60_000);
  if (limited) return limited;

  const resolved = await resolveOrganizerSession();
  if (!resolved.ok) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Dosya 10 MB sınırını aşıyor' }, { status: 400 });
  }

  const buffer = Buffer.from(arrayBuffer);
  const declaredType = file.type || 'image/jpeg';
  let contentType: string;
  try {
    if (declaredType === 'application/pdf') {
      const isPdf =
        buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
      if (!isPdf) {
        return NextResponse.json({ error: 'Geçersiz PDF dosyası' }, { status: 400 });
      }
      contentType = 'application/pdf';
    } else {
      contentType = assertImageUpload(buffer, declaredType);
    }
  } catch {
    const detected = detectImageMime(buffer);
    if (!detected) {
      return NextResponse.json({ error: 'Geçersiz görsel dosyası' }, { status: 400 });
    }
    contentType = detected;
  }
  const url = await uploadVenueMapImage(resolved.ctx.organizer.id, buffer, contentType);
  return NextResponse.json({ url });
}
