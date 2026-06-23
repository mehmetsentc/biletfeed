import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { ensureDbConnection } from '@/lib/db/prisma';
import { createUserSupportTicket } from '@/lib/services/user-support';

const bodySchema = z.object({
  category: z.enum(['refund', 'other']),
  body: z.string().min(10).max(1000)
});

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
    }

    const session = await verifySessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    await ensureDbConnection();

    const ticket = await createUserSupportTicket(session.uid, parsed.data);

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        createdAt: ticket.createdAt.toISOString()
      }
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Destek talebi gönderilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
