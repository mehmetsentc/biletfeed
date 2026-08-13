import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { rateLimitOrNull } from '@/lib/security/rate-limit';
import {
  registerPushDeviceToken,
  removePushDeviceToken
} from '@/lib/services/notification-preferences';

const bodySchema = z.object({
  token: z.string().trim().min(8).max(4096),
  platform: z.enum(['web', 'ios', 'android']).default('web'),
  userAgent: z.string().trim().max(300).optional()
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek kaynağı' }, { status: 403 });
  }

  const session = await verifySessionCookie();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const limited = rateLimitOrNull(
    request,
    `push-token:${session.uid}`,
    20,
    60_000
  );
  if (limited) return limited;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz token' }, { status: 400 });
  }

  try {
    await registerPushDeviceToken({
      firebaseUid: session.uid,
      token: parsed.data.token,
      platform: parsed.data.platform,
      userAgent: parsed.data.userAgent
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Token kaydedilemedi' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek kaynağı' }, { status: 403 });
  }

  const session = await verifySessionCookie();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 });
  }

  const parsed = z.object({ token: z.string().trim().min(8) }).safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz token' }, { status: 400 });
  }

  await removePushDeviceToken(session.uid, parsed.data.token);
  return NextResponse.json({ ok: true });
}
