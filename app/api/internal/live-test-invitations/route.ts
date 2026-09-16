import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { runLiveInvitationQrTest } from '@/lib/services/live-test-invitations';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** Tek seferlik canlı test — PR birleştirilmeden silinecek. */
const LIVE_TEST_TOKEN =
  'ff64cffcc4c1a1133e7f7213ff292e73ad4e9241b5a52cf0987a7af3413299cf';

function tokenMatches(provided: string): boolean {
  const expected = Buffer.from(LIVE_TEST_TOKEN);
  const got = Buffer.from(provided);
  if (expected.length !== got.length) return false;
  return timingSafeEqual(expected, got);
}

function isAuthorized(request: NextRequest): boolean {
  const header = request.headers.get('authorization') ?? '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const query = request.nextUrl.searchParams.get('token')?.trim() ?? '';
  return Boolean(bearer && tokenMatches(bearer)) || Boolean(query && tokenMatches(query));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  try {
    const result = await runLiveInvitationQrTest();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Canlı test başarısız';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
