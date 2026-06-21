import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifySessionCookie, sessionHasRole } from '@/lib/auth/session';
import { validateTicketInput } from '@/lib/services/ticket-validation';

const postSchema = z.object({
  ticketCode: z.string().optional(),
  validationToken: z.string().optional(),
  ticketId: z.string().optional(),
  qrRaw: z.string().optional(),
  markUsed: z.boolean().optional()
});

/** QR kod URL'si tarandığında GET ile de doğrulama yapılabilir (salt okunur). */
export async function GET(request: NextRequest) {
  const session = await verifySessionCookie();
  if (!session || !sessionHasRole(session, 'ROLE_ORGANIZER')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const result = await validateTicketInput({
    ticketCode: searchParams.get('code') || undefined,
    validationToken: searchParams.get('token') || undefined,
    ticketId: searchParams.get('id') || undefined,
    scannerUid: session.uid,
    scannerRole: session.role,
    markUsed: false
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await verifySessionCookie();
  if (
    !session ||
    (!sessionHasRole(session, 'ROLE_ORGANIZER') &&
      !sessionHasRole(session, 'ROLE_ADMIN'))
  ) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const json = await request.json();
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  const result = await validateTicketInput({
    ...parsed.data,
    scannerUid: session.uid,
    scannerRole: session.role,
    markUsed: parsed.data.markUsed ?? true
  });

  return NextResponse.json(result);
}
