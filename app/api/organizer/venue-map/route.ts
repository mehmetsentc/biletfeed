import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { resolveOrganizerSession } from '@/lib/auth/organizer-api';
import { uploadVenueMapImage } from '@/lib/firebase/admin-storage';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const resolved = await resolveOrganizerSession();
  if (!resolved.ok) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
  }

  const contentType = file.type || 'image/jpeg';
  if (!contentType.startsWith('image/') && contentType !== 'application/pdf') {
    return NextResponse.json({ error: 'Sadece görsel veya PDF yüklenebilir' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Dosya 10 MB sınırını aşıyor' }, { status: 400 });
  }

  const buffer = Buffer.from(arrayBuffer);
  const url = await uploadVenueMapImage(resolved.ctx.organizer.id, buffer, contentType);
  return NextResponse.json({ url });
}
