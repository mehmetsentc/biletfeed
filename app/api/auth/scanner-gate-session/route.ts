import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  PANEL_SESSION_COOKIE_NAME,
  getSessionCookieOptions
} from '@/lib/auth/session-cookie';
import { SESSION_EXPIRES_MS } from '@/lib/auth/session';
import { redeemScannerGateCode } from '@/lib/auth/scanner-gate';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

const bodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, 'Kapı kodunu girin')
    .max(1024, 'Kapı kodu çok uzun')
});

export async function POST(request: NextRequest) {
  const limited = rateLimitOrNull(request, 'auth-scanner-gate', 120, 60_000);
  if (limited) return limited;

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Geçersiz kod' },
      { status: 400 }
    );
  }

  const redeemed = await redeemScannerGateCode(parsed.data.code);
  if (!redeemed) {
    return NextResponse.json(
      { error: 'Kapı kodu geçersiz veya süresi dolmuş' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    success: true,
    email: redeemed.email,
    redirect: '/tarayici'
  });

  response.cookies.set(
    PANEL_SESSION_COOKIE_NAME,
    redeemed.sessionCookie,
    getSessionCookieOptions(SESSION_EXPIRES_MS / 1000)
  );

  return response;
}
