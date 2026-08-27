import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { cancelEventInvitationsBulk } from '@/lib/services/event-invitations';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const schema = z.object({
  invitationIds: z.array(z.string().uuid()).min(1).max(200)
});

/** Toplu davetiye iptali — örn. bir koltuk aralığındaki (Z2-Z10) tüm davetiyeleri tek istekte iptal eder. */
export async function POST(request: NextRequest) {
  const limited = rateLimitOrNull(request, 'organizer-invite-bulk-cancel', 20, 60_000);
  if (limited) return limited;

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Geçersiz veri — tek istekte en fazla 200 davetiye iptal edilebilir' },
      { status: 400 }
    );
  }

  const result = await cancelEventInvitationsBulk(parsed.data.invitationIds, ctx.organizer.id);
  return NextResponse.json({ success: true, ...result });
}
