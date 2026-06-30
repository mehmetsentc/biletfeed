import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { initiateTicketTransfer } from '@/lib/services/ticket-transfers';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

const bodySchema = z.object({
  toEmail: z.string().email()
});

type RouteParams = { params: Promise<{ ticketId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const limited = rateLimitOrNull(request, 'ticket-transfer', 10, 60_000);
  if (limited) return limited;

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await verifySessionCookie();
  if (!session) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });

  const { ticketId } = await params;
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz e-posta' }, { status: 400 });
  }

  try {
    const result = await initiateTicketTransfer({
      ticketId,
      fromFirebaseUid: session.uid,
      toEmail: parsed.data.toEmail
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Devir başarısız' },
      { status: 400 }
    );
  }
}
