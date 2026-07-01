import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie, sessionHasRole } from '@/lib/auth/session';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { validateTicketInput } from '@/lib/services/ticket-validation';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

const postSchema = z.object({
  ticketCode: z.string().optional(),
  validationToken: z.string().optional(),
  ticketId: z.string().optional(),
  qrRaw: z.string().optional(),
  eventId: z.string().uuid().optional(),
  scannerId: z.string().max(128).optional(),
  markUsed: z.boolean().optional(),
});

/** Panel erişimi olan organizatör veya admin — ROLE_ORGANIZER şart değil */
async function resolveScannerAuth() {
  const session = await verifySessionCookie();
  if (!session) return null;

  const organizer = await getOrganizerForSession(session.uid, session.email);
  if (organizer) {
    return { session, scannerOrganizerId: organizer.id };
  }

  if (sessionHasRole(session, 'ROLE_ADMIN')) {
    return { session, scannerOrganizerId: undefined };
  }

  return null;
}

/** QR kod URL'si tarandığında GET ile de doğrulama yapılabilir (salt okunur). */
export async function GET(request: NextRequest) {
  const limited = rateLimitOrNull(request, 'ticket-validate', 60, 60_000);
  if (limited) return limited;

  const auth = await resolveScannerAuth();
  if (!auth) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const result = await validateTicketInput({
    ticketCode: searchParams.get('code') || undefined,
    validationToken: searchParams.get('token') || undefined,
    ticketId: searchParams.get('id') || undefined,
    scannerUid: auth.session.uid,
    scannerEmail: auth.session.email,
    scannerRole: auth.session.role,
    scannerOrganizerId: auth.scannerOrganizerId,
    markUsed: false,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const limited = rateLimitOrNull(request, 'ticket-validate', 60, 60_000);
  if (limited) return limited;

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const auth = await resolveScannerAuth();
  if (!auth) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const json = await request.json();
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  const result = await validateTicketInput({
    ...parsed.data,
    scannerUid: auth.session.uid,
    scannerEmail: auth.session.email,
    scannerRole: auth.session.role,
    scannerOrganizerId: auth.scannerOrganizerId,
    markUsed: parsed.data.markUsed ?? true,
    scannerId: parsed.data.scannerId,
    eventId: parsed.data.eventId,
    ipAddress:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      undefined,
    device: request.headers.get('user-agent') || undefined,
  });

  return NextResponse.json(result);
}
