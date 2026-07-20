import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { cancelEventInvitation } from '@/lib/services/event-invitations';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const idSchema = z.string().uuid();

/** Davetiye iptali — yanlış oluşturulan / gönderilen davetiyeler için */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const limited = rateLimitOrNull(request, 'organizer-invite-cancel', 60, 60_000);
  if (limited) return limited;

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz davetiye' }, { status: 400 });
  }

  try {
    const invitation = await cancelEventInvitation(parsed.data, ctx.organizer.id);
    return NextResponse.json({ success: true, invitation });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Davetiye iptal edilemedi';
    const status =
      message.includes('bulunamadı') ? 404
      : message.includes('kullanılmış') || message.includes('zaten') ? 409
      : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
