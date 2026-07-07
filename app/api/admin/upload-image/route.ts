import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { uploadAdminImage, isFirebaseStorageUploadConfigured } from '@/lib/firebase/admin-storage';
import { assertImageUpload } from '@/lib/security/image-upload';

const MAX_BYTES = 5 * 1024 * 1024;

const scopeSchema = z.enum(['events', 'feed']);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const scopeParsed = scopeSchema.safeParse(formData.get('scope') ?? 'events');
    if (!scopeParsed.success) {
      return NextResponse.json({ error: 'Geçersiz scope' }, { status: 400 });
    }

    const permission = scopeParsed.data === 'feed' ? 'feed.manage' : 'events.manage';
    const guard = await guardAdminMutation(request, permission);
    if ('error' in guard) return guard.error;

    if (!isFirebaseStorageUploadConfigured()) {
      return NextResponse.json({ error: 'Storage yapılandırılmamış' }, { status: 503 });
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }
    if (!scopeParsed.success) {
      return NextResponse.json({ error: 'Geçersiz scope' }, { status: 400 });
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
    const url = await uploadAdminImage(scopeParsed.data, buffer, verifiedType);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yükleme başarısız';
    const status = message.includes('Geçersiz') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
