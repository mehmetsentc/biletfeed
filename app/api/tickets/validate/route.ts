import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { resolveScannerContext } from '@/lib/auth/organizer-api';
import { validateTicketInput } from '@/lib/services/ticket-validation';
import { rateLimitOrNull, checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

const postSchema = z.object({
  ticketCode: z.string().optional(),
  validationToken: z.string().optional(),
  ticketId: z.string().optional(),
  qrRaw: z.string().optional(),
  eventId: z.string().uuid().optional(),
  scannerId: z.string().max(128).optional(),
  markUsed: z.boolean().optional(),
});

/** Panel erişimi olan organizatör veya admin */
async function resolveScannerAuth() {
  const ctx = await resolveScannerContext();
  if (!ctx) return null;
  return {
    session: ctx.session,
    scannerUserId: ctx.scannerUserId,
    scannerOrganizerId: ctx.scannerOrganizerId
  };
}

/** Organizer-scoped limit for venue scanning; IP fallback before auth resolves. */
function ticketValidateRateLimit(
  request: NextRequest,
  organizerId?: string,
  uid?: string
): ReturnType<typeof rateLimitOrNull> {
  const ip = getClientIp(request);
  const scopeKey = organizerId
    ? `ticket-validate:org:${organizerId}`
    : uid
      ? `ticket-validate:uid:${uid}`
      : `ticket-validate:ip:${ip}`;

  const scoped = checkRateLimit(scopeKey, organizerId ? 1800 : 300, 60_000);
  if (!scoped.ok) {
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin.' },
      {
        status: 429,
        headers: { 'Retry-After': String(scoped.retryAfterSec) }
      }
    );
  }

  if (!organizerId) {
    return rateLimitOrNull(request, 'ticket-validate', 300, 60_000);
  }

  return null;
}

/** QR kod URL'si tarandığında GET ile de doğrulama yapılabilir (salt okunur). */
export async function GET(request: NextRequest) {
  const auth = await resolveScannerAuth();
  if (!auth) {
    const limited = ticketValidateRateLimit(request);
    if (limited) return limited;
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const limited = ticketValidateRateLimit(
    request,
    auth.scannerOrganizerId,
    auth.session.uid
  );
  if (limited) return limited;

  const { searchParams } = request.nextUrl;
  const result = await validateTicketInput({
    ticketCode: searchParams.get('code') || undefined,
    validationToken: searchParams.get('token') || undefined,
    ticketId: searchParams.get('id') || undefined,
    scannerUid: auth.session.uid,
    scannerEmail: auth.session.email,
    scannerRole: auth.session.role,
    scannerUserId: auth.scannerUserId,
    scannerOrganizerId: auth.scannerOrganizerId,
    markUsed: false,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const auth = await resolveScannerAuth();
  if (!auth) {
    const limited = ticketValidateRateLimit(request);
    if (limited) return limited;
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const limited = ticketValidateRateLimit(
    request,
    auth.scannerOrganizerId,
    auth.session.uid
  );
  if (limited) return limited;

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
    scannerUserId: auth.scannerUserId,
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
