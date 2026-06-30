import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { acceptTicketTransfer } from '@/lib/services/ticket-transfers';

type RouteParams = { params: Promise<{ transferId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await verifySessionCookie();
  if (!session) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });

  const { transferId } = await params;

  try {
    const result = await acceptTicketTransfer({
      transferId,
      firebaseUid: session.uid
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Devir kabul edilemedi' },
      { status: 400 }
    );
  }
}
