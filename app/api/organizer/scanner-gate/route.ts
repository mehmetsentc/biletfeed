import { NextRequest, NextResponse } from 'next/server';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import {
  createScannerGateCode,
  listScannerGateCodes,
  SCANNER_GATE_CODE_TTL_SEC,
  SCANNER_GATE_MAX_ACTIVE_CODES
} from '@/lib/auth/scanner-gate';
import { isSameOriginRequest } from '@/lib/auth/csrf';

export async function GET() {
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const codes = await listScannerGateCodes(ctx.organizer.id);

  return NextResponse.json({
    codes,
    maxActiveCodes: SCANNER_GATE_MAX_ACTIVE_CODES,
    ttlHours: SCANNER_GATE_CODE_TTL_SEC / 3600
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  try {
    const created = await createScannerGateCode({
      organizerId: ctx.organizer.id,
      uid: ctx.session.uid,
      email: ctx.user.email,
      role: ctx.session.role
    });

    return NextResponse.json({
      code: created.code,
      expiresAt: created.expiresAt.toISOString(),
      maxActiveCodes: SCANNER_GATE_MAX_ACTIVE_CODES,
      ttlHours: SCANNER_GATE_CODE_TTL_SEC / 3600
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Kapı kodu oluşturulamadı';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
